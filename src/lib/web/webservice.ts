import * as express from 'express';
import * as bodyparser from 'body-parser';
import {CodeExtractor} from './codeextractor';
import {VzRouter} from './router';
import { Server } from 'http';
export enum RouteType
{
    POST,
    GET,
    USE
}

export interface IRoute
{
    Path: string;
    Exec: (...params:any[])=>Promise<string|{}>;
    Type: RouteType;
    Target: any;
    Params: string[];
    Description: string;
    UriParams: string[];
}

export interface IWSError
{
    Code: number;
    Message: string;
}

const WebserviceError = 
{
    MissingParameter: 'MISSING_PARAMETER',
}

const API_LIST_ROUTE = '/routeslist'
export class VzApified
{
    
    protected service: express.Express;
    protected routesList: string = '';
    protected port: number;
    protected routers: VzRouter[] = [];
    protected server: Server;

    constructor(port: number)
    {
        this.service = express();
        this.port = port;
        this.service.use(bodyparser.json());
        this.service.use(bodyparser.urlencoded({ extended: true }));
        this.service.use(API_LIST_ROUTE, this.listAllRoutes);
    }

    public Init()
    {
        if(this['__routes'])
        {
            let routes: IRoute[] = this['__routes'];
            for(let idx = 0; idx < routes.length; idx++)
            {
                routes[idx].Target = this;
            }
          
            for (let idx = 0; idx < this.routers.length; idx++)
            {
                const current = this.routers[idx];
                routes = routes.concat(current.GetRoutes());
            }

            for(let idx = 0; idx < routes.length; idx++)
            {
                this.AddRoute(routes[idx]);
            }
            delete this['__routes'];
        }

        
    }

    public Start()
    {
       this.Init();
        for(let idx = 0; idx < this.routers.length; idx++)
        {
            const routes = this.routers[idx].GetRoutes();
            for(let idx2 = 0; idx2 < routes.length; idx2++)
            {
                this.AddRoute(routes[idx]);
            }
        }
        this.server = this.service.listen(this.port);
    }

    public Stop()
    {
        if (this.server)
        {
            this.server.close();
        }
    }

    public AddRouter(router: VzRouter)
    {
        this.routers.push(router);
    }

    public GetPort()
    {
        return this.port;
    }

    public GetApplication() 
    {
        return this.service;
    }

    
    private getMethod(type: RouteType)
    {
        let result = '';
        switch(type)
        {
            case RouteType.GET: 
                result = 'GET';
                break;
            case RouteType.POST: 
                result = 'POST';
                break;
        }
        return result;
    }
    
    public AddGetRoute(path: string, exec: (req: express.Request, res: express.Response<any>, next)=> void)
    {
        this.service.get(path, exec);
    }

    protected checkParams = (paramList: string[], uriParams: string[], params: any[], target, dataSrc: {[id:string]: any}, req, res) =>
    {
        for(let idx = 0; idx < paramList.length; idx++)
        {
            if (uriParams)
            {
                for(let idx = 0; idx <uriParams.length; idx++)
                {
                    dataSrc[uriParams[idx]] = req.params[uriParams[idx]];
                }
            }
            const paramName = paramList[idx];
            let val = dataSrc[paramName];
            if (paramName.toLowerCase() == 'self')
            {
                val = target;
            } 
            if (val)
            {
                params.push(val);
            }
            else 
            {
                return false;
            }
           
        }
        return true;
    }

    protected mergeParams = (body: any, query: any, headers: any): {[id:string]: any} => 
    {
        const result:{[id:string]: any} = {}
        for (let key in body)
        {
            result[key]= body[key];
        }

        for (let key in query)
        {
            result[key]= query[key];
        }

        for (let key in headers)
        {
            result[key]= headers[key];
        }

        return result;
    }

    protected parseMiddlewareResult(result: {}, req)
    {
        for(let key in result)
        {
            req.body[key] = result[key];
            req.query[key] = result[key];
        }
    }

    protected manageMiddleware = (req, res, next, target: VzRouter, paramList: string[], fct: (...params: any[]) =>Promise<{}>) =>
    {
        let params = [];
        let dataSrc = this.mergeParams(req.body, req.query, req.headers);
        this.checkParams(paramList, null, params, target, dataSrc, req, res);

        fct(...params)
        .then((result:{}) =>
        {
            this.parseMiddlewareResult(result, req);
            next();
        })
    }

    private manageCall = (req, res, next, target: VzRouter, paramList: string[], uriParams: string[], fct: (...params:any[])=>Promise<string|{}>) =>
    {
        const params = [];
        if (paramList)
        {
            let dataSrc;
            switch (req.method)
            {
                case 'POST':
                    dataSrc = req.body;
                    break;
                case 'GET':
                    dataSrc = req.query;
                    break;
            }
            
            if (!this.checkParams(paramList, uriParams, params, target, dataSrc, req, res))
            {
               return res.status(400).send(WebserviceError.MissingParameter);
            }

            fct(...params)
            .then((result)=>
            {
                if (typeof result == 'string')
                {
                    res.status(200).send(result);
                }
                else 
                {
                    res.status(200).json(result);
                }
            })
            .catch((err: IWSError)=>
            {
                res.status(err.Code).send(err.Message);
            })
        }
    }

    public AddRoute(current: IRoute)
    {
        this.routesList += '<br /> <b>' + current.Path + '</b> <br /> - Mandatory parameter(s): ' + current.Params.join(', ')+'<br /> - Method : ' + this.getMethod(current.Type) + '<br />';
        this.routesList += current.Description +'<br /><br /><br />';
        if (current.Path)
        {
            switch(current.Type)
            {
                case RouteType.GET:
                    this.service.get(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Params, current.UriParams, current.Exec));
                    break;
                case RouteType.POST:
                    this.service.post(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Params, current.UriParams, current.Exec));
                    break;

                case RouteType.USE:
                    this.service.use((req, res, next)=> this.manageMiddleware(req, res, next, current.Target, current.Params, current.Exec));
                    break; 
                    
                default: 
                    this.service.use(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Params, current.UriParams, current.Exec));
                    break;
            }
            
        }   
        else 
        {
            this.service.use(current.Exec);
        }
    }   
    
    private listAllRoutes = (req: express.Request, res: express.Response, next)=>
    {
        res.status(200).send(this.routesList)
        
    }    
}

export function GET(description, params?: Array<string>|boolean)
{
   return restCreate(description, RouteType.GET, params);
}

/**
 * @deprecated Use GET instead
 */

export function GET_REST(description, params?: Array<string>|boolean)
{
   return restCreate(description, RouteType.GET, params);
}

export function POST(description, params?: Array<string>|boolean)
{
   return restCreate(description, RouteType.POST, params);
}

/**
 * @deprecated Use POST instead
 */
export function POST_REST(description, params?: Array<string>|boolean)
{
   return restCreate(description, RouteType.POST, params);
}

export function USE(description)
{
    return restCreate(description, RouteType.USE, null);
}

function restCreate(description: string, type: RouteType, params?: Array<string>|boolean)
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const parametersList = CodeExtractor.GetParams(descriptor.value);
        
        let paramsQuery = '';
        if (params)
        {
            if (params === true)
            {
                paramsQuery = '/:id';
            }
            else 
            {
                for(let idx = 0; idx < params.length; idx++)
                {
                    const currentParam = params[idx].trim();
                    if (currentParam != '')
                    {
                        paramsQuery += '/:'+currentParam;
                    }
                }
                
            }

        }
        const route: IRoute =
        {
            Path: '/'+ propertyKey + paramsQuery ,
            Exec: descriptor.value,
            Params: parametersList,
            Target: target, 
            UriParams: (params === true?['id']:<string[]>params),
            Description: description,
            Type: type
        }
        if (!target['__routes'])
        {
            target['__routes'] = [];
        }

        target['__routes'].push(route);
    };
}