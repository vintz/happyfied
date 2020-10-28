

import {CodeExtractor} from './codeextractor';
import {HappyRouter} from './router';
import { Server } from 'http';
import { HappyServer, IncomingMessage, ServerResponse } from '../innerweb/innerwebservice';

import {Request, Response} from 'express';

 




export interface IOptions
{
    params?: Array<string>;
    wildcard?: boolean;
    static?: string;
}

export enum RouteType
{
    POST = "POST",
    GET = "GET",
    USE = "USE",
    BEFORE = "BEFORE",
    HEAD = "HEAD",
    PUT  = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH"
}

export enum CallType
{
    SimpleMiddleware,
    Call,
}

export interface ISendFileInfo
{
    Root: string;
    FilePath?: string; 
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
    FileError: 'FILE_ERROR',
    FileNotFound: 'FILE_NOT_FOUND'
}

const API_LIST_ROUTE = '/routeslist';


export class Happyfied 
{
    protected express: any;
    protected happyServer: HappyServer;
    protected routesList: string = '';
    protected port: number;
    protected routers: HappyRouter[] = [];
    protected server: Server;
    
    constructor(port: number, useExpress?: boolean)
    {
        if(useExpress)
        {
            this.express = require('express')();
            this.express.use(require('body-parser').json());
            this.express.use(require('body-parser').urlencoded({ extended: true }));
            this.express.use(API_LIST_ROUTE, this.listAllRoutes);
        }
        else 
        {
            this.happyServer = new HappyServer(port);
            this.happyServer.AddRoute(RouteType.USE, API_LIST_ROUTE, this.listAllRoutes)
        }
        
        this.port = port;
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
        if (this.express)
        {
            this.server = this.express.listen(this.port);
        }
    }

    public Stop()
    {
        if (this.server)
        {
            this.server.close();
        }
        else if (this.happyServer)
        {
            this.happyServer.Close();
        }
    }

    public AddRouter(router: HappyRouter)
    {
        this.routers.push(router);
    }

    public GetPort()
    {
        return this.port;
    }

    public GetApplication() 
    {
        return this.express;
    }

    
    private getMethod(type: RouteType)
    {
        let result = '';
        switch(type)
        {
            case RouteType.USE:
                result = 'ALL';
                break;
            default: 
                result = type;
                break;
        }
        return result;
    }
   
    protected checkParams = (paramList: string[], uriParams: string[], params: any[], target, dataSrc: {[id:string]: any}, req: Request|IncomingMessage, res) =>
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
            if (paramName.toLowerCase() == 'self' || paramName.toLowerCase() == '_self')
            {
                val = target;
            } 
            
            if (paramName.toLowerCase() == '_method')
            {
                val = req.method;
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
            result[key.toLowerCase()]= body[key];
        }

        for (let key in query)
        {
            result[key.toLowerCase()]= query[key];
        }

        for (let key in headers)
        {
            result[key.toLowerCase()]= headers[key];
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

    protected respond(res: Response<any> | ServerResponse, code: number, message: string) 
    {
        if (this.express)
        {
            const res2 = <Response<any>> res;
            res2.status(code).send(message);
        }
        else 
        {
            const res2  = <ServerResponse> res;
            res2.Respond(code, message);
        }
    }

    protected respondJson(res: Response<any> | ServerResponse, code: number, message: {}) 
    {
        if (this.express)
        {
            const res2 = <Response<any>> res;
            res2.status(code).json(message);
        }
        else 
        {
            const res2  = <ServerResponse> res;
            res2.JSON(code, message);
        }
    }

    protected manageMiddleware = (type: CallType, req: Request|IncomingMessage, res: Response|ServerResponse, routePath: string, next, target: HappyRouter, paramList: string[], uriParams: string[], fct: (...params: any[]) =>Promise<{}>) =>
    {
        let params = [];
        let dataSrc = this.mergeParams(req.body, req.query, req.headers);
        let shouldContinue = true;
        switch(type)
        {
            case CallType.SimpleMiddleware:
                this.checkParams(paramList, null, params, target, dataSrc, req, res);
                break;

            case CallType.Call:
                shouldContinue = this.checkParams(paramList, uriParams, params, target, dataSrc, req, res);
                break;
        }
       
        if (!shouldContinue)
        {
            return this.respond(res, 400, WebserviceError.MissingParameter);
        }
        let res1 = fct(...params);
        
        if (!res1.then)
        {
            res1 = Promise.resolve(res1);
        }

        res1.then((result:{}) =>
        {
            switch(type)
            {
                case CallType.SimpleMiddleware:
                    this.parseMiddlewareResult(result, req);
                    next();
                    break;

                case CallType.Call:
                    this.parseCallResult(result, req, res, routePath);
                    break;
            }
            
        })
        .catch((err: IWSError|string|Error)=>
        {
            if (typeof err == 'string')
            {
                this.respond(res, 400, err);
            }
            else if (err && (<Error>err).stack && (<Error>err).message)
            {
                this.respond(res, 400, (<Error>err).message + ' ' + (<Error>err).stack);
            }
            else 
            {
                this.respond(res, (<IWSError>err).Code, (<IWSError>err).Message);
            }
        })
    }
    
    public parseCallResult = (result: string|number|{}, req: Request|IncomingMessage, res: Response|ServerResponse, routePath: string) =>
    {
        if (typeof result == 'string')
        {
            return this.respond(res, 200, result) ;
        }
        else if (typeof result == 'number')
        {
            return this.respond(res, 200, result.toString(10));
        }
        else if (result['__sendfile'])
        {
            const filePath = result['__sendfile'].FilePath?result['__sendfile'].FilePath:req.originalUrl.replace(routePath.toLowerCase().replace('*',''),'');
            res.sendFile(filePath, {root: result['__sendfile'].Root}, (err)=>
            {
                if (err)
                {
                    this.respond(res, 404, WebserviceError.FileNotFound) ;
                }
            });
        }
        else 
        {
            this.respondJson(res, 200, result);
        }
    }

    protected manageSimpleMiddleware = (req: Request|IncomingMessage, res: Response|ServerResponse, next, target: HappyRouter, paramList: string[], fct: (...params: any[]) =>Promise<{}>) =>
    {
        this.manageMiddleware(CallType.SimpleMiddleware, req, res, null, next, target, paramList, null, fct);
    }
    
    private manageCall = (req: Request|IncomingMessage, res: Response|ServerResponse, next, target: HappyRouter, routePath: string,  paramList: string[], uriParams: string[], fct: (...params:any[])=>Promise<string|{}>) =>
    {
        this.manageMiddleware(CallType.Call, req, res, routePath, next, target, paramList, uriParams, fct);
    }

    public AddRoute(current: IRoute)
    {
        this.routesList += '<br /> <b>' + current.Path + '</b> <br /> - Mandatory parameter(s): ' + current.Params.join(', ')+'<br /> - Method : ' + this.getMethod(current.Type) + '<br />';
        this.routesList += current.Description +'<br /><br /><br />';
        if (current.Path)
        {
            if(this.express)
            {
                this.addRouteExpress(current);
            }
            else 
            {
                this.addRouteHappy(current)
            }
        }   
        else 
        {
            this.express.use(current.Exec);
        }
    }   

    protected addRouteHappy = (current: IRoute) =>
    {
        if (current.Type == RouteType.BEFORE)
        {
            this.happyServer.AddRoute(RouteType.USE, null, (req, res, next) => this.manageSimpleMiddleware(req, res, next, current.Target, current.Params, current.Exec))
        }
        else 
        {
            this.happyServer.AddRoute(current.Type, current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Path, current.Params, current.UriParams, current.Exec));
        }
    }
    
    protected addRouteExpress = (current: IRoute) =>
    {
        switch(current.Type)
        {
            case RouteType.GET:
                this.express.get(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Path, current.Params, current.UriParams, current.Exec));
                break;
           
            case RouteType.POST:
                this.express.post(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Path, current.Params, current.UriParams, current.Exec));
                break;

            case RouteType.BEFORE:
                    this.express.use((req, res, next)=> this.manageSimpleMiddleware(req, res, next, current.Target, current.Params, current.Exec));
                    break; 
                    
            case RouteType.USE:
                this.express.use(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Path, current.Params, current.UriParams, current.Exec));
                break; 
    
                
            default: 
                this.express.use(current.Path, (req, res, next) => this.manageCall(req, res, next, current.Target, current.Path, current.Params, current.UriParams, current.Exec));
                break;
        }
    }
    protected listAllRoutes = (req: Request|IncomingMessage, res: Response|ServerResponse, next)=>
    {
        this.respond(res, 200, this.routesList);
    }    

    protected static = (path) =>
    {
        return this.express.static(path);
    }
}

export function GET(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.GET, params);
}

/**
 * @deprecated Use GET instead
 */

export function GET_REST(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.GET, params);
}

export function POST(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.POST, params);
}

/**
 * @deprecated Use POST instead
 */
export function POST_REST(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.POST, params);
}

export function HEAD(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.HEAD, params);
}

export function PUT(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.PUT, params);
}

export function DELETE(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.DELETE, params);
}

export function PATCH(description, params?: Array<string>|boolean|IOptions)
{
   return restCreate(description, RouteType.PATCH, params);
}

export function BEFORE(description)
{
    // TODO VERIFIER
    return restCreate(description, RouteType.BEFORE, null);
}

export function USE(description, params?: Array<string>|boolean|IOptions)
{
    return restCreate(description, RouteType.USE, params);
}
export 

function restCreate(description: string, type: RouteType, params?: Array<string>|boolean|IOptions)
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const parametersList = CodeExtractor.GetParams(descriptor.value, true);
        
        let exec = descriptor.value;
        let paramsQuery = '';
        if (params)
        {
            if (params === true)
            {
                paramsQuery = '/:id';
            }
            else if (Array.isArray(params))
            {
                paramsQuery = parseCreateParams(params, paramsQuery);
            }
            else 
            {
                const options1 = <IOptions>params;
                if (options1.params)
                {
                    paramsQuery = parseCreateParams(options1.params, paramsQuery);
                }

                if (options1.wildcard === true)
                {
                    paramsQuery += '*';
                }

                if (options1.static)
                {
                    exec = (...params)=>
                    {
                        let filePath = null;
                        if (descriptor.value)
                        {
                            const tmp = descriptor.value(...params);
                            if (tmp && tmp.then)
                            {
                                return tmp.then((value)=>
                                {
                                    const res = {__sendfile: {Root: options1.static, FilePath: value}};
                                    return Promise.resolve(res); 
                                })
                            } 
                            else 
                            {
                                if (typeof tmp === 'string')
                                {
                                    filePath = tmp;
                                }
                            }  
                        }
                        return Promise.resolve({__sendfile: {Root: options1.static, FilePath: filePath}});
                        
                    }
                }
            }
        }

        const route: IRoute =
        {
            Path: '/'+ propertyKey + paramsQuery ,
            Exec: exec,
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

function parseCreateParams(params: Array<string>, paramsQuery: string)
{
    let finaleQuery = paramsQuery;
    for(let idx = 0; idx < params.length; idx++)
    {
        const currentParam = params[idx].trim();
        if (currentParam != '')
        {
            finaleQuery += '/:'+currentParam;
        }
    }

    return finaleQuery;
    
}