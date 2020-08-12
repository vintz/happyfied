import * as socketio from "socket.io";
import { VzApified } from "./webservice";

import {Server as HTTPServer, createServer} from 'http';
import { CodeExtractor } from "./codeextractor";


interface ISocketEvent 
{
    Name: string;
    Exec: (...params:any[])=>Promise<string|{}>;
    Target: any;
    Params: string[];
}

export class VzSocketified 
{
    protected io: socketio.Server;

    constructor(portOrWebservice: number|VzApified)
    {
        if (typeof portOrWebservice == 'number')
        {
            this.io = socketio(<number>portOrWebservice);
        }
        else 
        {
            const ws = <VzApified> portOrWebservice;
            const server = createServer(ws.GetApplication());
            this.io = socketio(server);
            server.listen(ws.GetPort());
        }
        this.handleSocketConnection();
    }

    public Init = (socket: socketio.Socket) =>
    {
        if(this['__events'])
        {
            let events: ISocketEvent[] = this['__events'];
            for(let idx = 0; idx < events.length; idx++)
            {
                events[idx].Target = this;
            }
          
            for(let idx = 0; idx < events.length; idx++)
            {
                const currentEvent = events[idx];
                socket.on(currentEvent.Name,  (...args: any[]) => this.manageCall(socket, currentEvent.Target, currentEvent.Params, currentEvent.Exec, ...args));
                if (currentEvent.Name == 'connection')
                {
                    this.manageCall(socket, currentEvent.Target, currentEvent.Params, currentEvent.Exec, []);
                }
            }
        }
    }
    
    private manageCall = (socket: socketio.Socket, target: VzSocketified, paramList: string[],  fct: (...params:any[])=>Promise<string|{}>, ...args:any[]) =>
    {
        const params = [];
        let offset = 0;
        for (let idx = 0; idx < paramList.length; idx++)
        {
            const param = paramList[idx];
            switch(param)
            {
                case 'self':
                    offset++;
                    params.push(target);
                    break;

                case 'socket':
                    offset++; 
                    params.push(socket);
                    break;

                default: 
                    if (args.length > idx - offset)
                    {
                        params.push(args[idx - offset]);
                    }
                    else 
                    {
                        socket.emit('SOCKET_PARAMS_ERROR');
                        return;
                    }
                    break;
            }
        }
        fct(...params);
    }

    
    private handleSocketConnection = () =>
    {
        this.io.on("connection", socket => 
        {
            this.Init(socket);
        })
    }
}


export function SOCKET_EVENT()
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const parametersList = CodeExtractor.GetParams(descriptor.value);
        
        const socketEvent: ISocketEvent =
        {
            Name: propertyKey,
            Exec: descriptor.value,
            Params: parametersList,
            Target: target, 
        }
        if (!target['__events'])
        {
            target['__events'] = [];
        }

        target['__events'].push(socketEvent);
    };
}