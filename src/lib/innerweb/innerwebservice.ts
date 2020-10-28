import * as Http from 'http';
import { RouteType } from '../web/happyfied';
import { url } from 'inspector';
import * as Path from 'path';
import * as FS from 'fs';

export const Errors = 
{
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    UNABLE_TO_READ_BODY: 'UNABLE_TO_READ_BODY'
}

interface IRouteDef 
{
    Path: string;
    Exec: (req: Http.IncomingMessage, res: ServerResponse, next) => void;
    RouteType: RouteType;
    Regexp: {Regexp: RegExp, Ids: string[]};
}

export interface IncomingMessage extends Http.IncomingMessage
{
    body: {[id: string]: any};
    bodyData: any;
    query: {[id: string]: any};
    params: {[id: string]: any};
    originalUrl: string;
}

export interface ISendFileOptions
{
    root: string;
}

export class ServerResponse 
{
    protected response:  Http.ServerResponse;

    constructor(response)
    {
        this.response = response;
    }
    
    public Respond( code: number, body: string)
    {
        this.response.writeHead(code, {'Content-Type': 'text/html'}); 
        this.response.write(body); 
        this.response.end(); 
    }

    public JSON(code: number, body: {})
    {
        this.response.writeHead(code, {'Content-Type': 'application/json'}); 
        this.response.write(JSON.stringify(body)); 
        this.response.end(); 
    }

    protected getNormalizedPath(path: string, options: ISendFileOptions)
    {
        if (options && options.root)
        {
            let finalPath = Path.join(options.root, path);
            finalPath = Path.normalize(finalPath);
            const root = Path.normalize(options.root);
            if (finalPath.indexOf(root) == 0)
            {
                return finalPath;
            }
            else 
            {
                return null;
            }
        }
        else 
        {
            return Path.normalize(path);
        }
    }

    public sendFile(path: string, options: ISendFileOptions, done:(err: Error)=>void)
    {
        const finalPath = this.getNormalizedPath(path, options);
        if (finalPath)
        {
            FS.exists(finalPath, (exists: boolean)=>
            {
                if (exists)
                {
                    let stream = FS.createReadStream(finalPath);
                    stream.on('error', function() {
                        done(new Error(Errors.FILE_NOT_FOUND));
                    });
                    stream.pipe(this.response);
                }
                else 
                {
                    done(new Error(Errors.FILE_NOT_FOUND));
                }
            })
        }
        else 
        {
            done(new Error(Errors.FILE_NOT_FOUND));
        }
                
    }
}

export class HappyServer
{
    protected server: Http.Server;
    protected routes: Array<IRouteDef>;


    constructor(port: number)
    {
        this.routes = [];
        this.server = Http.createServer((req: IncomingMessage, res: Http.ServerResponse) =>
        {
            const res2 = new ServerResponse(res);
            this.parseRequest(req, res2);
        })
        .listen(port);
    }

    public Close()
    {   
        if (this.server)
        {
            this.server.close();
        }
    }

    protected pathToRegexp(path: string)
    {
        const found = [];
        let regexp: RegExp = null;
        if (path)
        {
            let res = path;
            const regexp1 = new RegExp('(:[^/]+)', 'g')
            let tmp;
            res = res.replace(/\*/g, '(.*)');
            while ((tmp = regexp1.exec(path)) !== null)
            {
                res = res.replace(tmp[0],'([^/]*)');
                found.push(tmp[0].replace(':',''));
            }
            
            res += '$';
            regexp = new RegExp(res, '');
        }
        return {Regexp: regexp, Ids: found};
    }

    public AddRoute(type: RouteType, path: string, exec: (req: IncomingMessage, res: ServerResponse, next: ()=>void) => void)
    {
        const truePath = path?path.trim().toLowerCase():null;
        const route : IRouteDef = 
        {
            RouteType: type, 
            Path: path?path.trim().toLowerCase():null,
            Regexp: this.pathToRegexp(truePath),
            Exec: exec
            
        }
        this.routes.push(route);
    }

    protected parseBody(req: IncomingMessage, done: (err:Error)=>void)
    {
        let body = '';

        req.on('readable', function() {
            const tmp = req.read();
            if (tmp)
            {
                body += tmp;
            }
        });

        req.on('end', function() {
            if (req.headers["content-type"] == "application/json")
            {
                req.body = JSON.parse(body);
            }
            else 
            {
                req.bodyData = body;
                req.body = {};
            }
            done(null);
        });

        req.on('error', ()=>
        {
            done(new Error(Errors.UNABLE_TO_READ_BODY))
        })
    }

    protected parseRequest(req: IncomingMessage, res: ServerResponse)
    {
        const urlInfo = this.parseUrl(req.url);
        req.originalUrl = req.url.toLowerCase();
        req.query = urlInfo.Parameters;
      
        this.parseBody(req, (err)=>
        {
            if (err)
            {
                console.log(err);
            }
            else 
            {
                if (this.routes && this.routes.length > 0)
                {
                    this.innerParseRequest(req, res, urlInfo.Route, 0)
                }
            }
        });
    }

    protected innerParseRequest(req: IncomingMessage, res: ServerResponse, route: string,  idx: number) 
    {
        if (this.routes.length > idx)
        {
            const currentRoute = this.routes[idx]
            if (this.checkPath(route, req.method,  currentRoute))
            {
                if(currentRoute.Regexp.Ids && currentRoute.Regexp.Ids.length > 0)
                {
                    req.params = {};
                    const tmp = currentRoute.Regexp.Regexp.exec(route);
                    for (let idx2 = 0; idx2 < currentRoute.Regexp.Ids.length; idx2++)
                    {
                        const id = currentRoute.Regexp.Ids[idx2];
                        req.params[id] = tmp[idx2+1];
                    }
                }
                currentRoute.Exec(req, res, ()=>
                {
                    this.innerParseRequest(req, res, route, idx+1);
                })
            }
            else 
            {
                this.innerParseRequest(req, res, route, idx+1);
            }
        }
        else 
        {
            res.Respond(404, 'Can not ' + req.method + ' ' + route );
        }
    }


    protected checkPath(path: string, method: string,  route: IRouteDef): boolean 
    {
        if (route.Path)
        {
            if (route.Regexp.Regexp.test(path) && ((route.RouteType == RouteType.USE) || (route.RouteType == method)))
            {
                return true;
            }
            else 
            {
                return false;
            }
        }
        else 
        {
            return true;
        }
    }

    protected parseUrl(url: string)
    {
        const splitted = url.split('?', 2); 
        const parametersSplitted = splitted.length > 1? splitted[1].split('&'): null;
        const parameters = {};
        if (parametersSplitted)
        {
            for (let idx = 0; idx < parametersSplitted.length; idx++)
            {
                const current = parametersSplitted[idx];
                const parameter = current.split('=',2);
                parameters[parameter[0].toLowerCase()] = parameter.length > 1? parameter[1]: null;
            }
        }
        return { Route: splitted[0].toLowerCase(), Parameters: parameters};
    }

    
}