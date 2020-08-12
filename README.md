

```typescript
import {VzApified, GET_REST} from 'vz-apified';

class ApifiedSample extends VzApified
{
    @GET_REST('Test api method')
    public Test(data: string)
    {
        return Promise.resolve({data: data, result: true});
    }
}

const api = new ApifiedSample(2010);
api.start();

```

# Installation
This is a nodejs Typescript module.

Installation is done using the npm install command:

$ npm install vz-apified

To use it, you have to enable decorators by adding the following entry in the compiler options of the tsconfig.json:
```
"experimentalDecorators": true,
```

# Quickstart

The first thing to do is to import the parent class and the decorators

```typescript
import {VzApified, GET_REST, POST_REST} from 'vz-apified';
```

After that you have to create a class extending the VzApified class. Any method that has a GET_REST or POST_REST decorator will be transformed into an API method with the same name and the same parameters.
The decorators are used as methods with a single parameter that should describe the API method

```typescript
class ApifiedSample extends VzApified
{
    @GET_REST('Test api method')
    public Test(data: string)
    {
        return Promise.resolve({data: data, result: true});
    }

    @GET_POST('Post test api method')
    public Test2(data: string)
    {
        return Promise.resolve({data: data, result: true});
    }

}
```

The class methods have to return a Promise. 
If the promise succeeds, the return can be of any type and it will be send to the caller with a 200 status. 
If the promise fails, the return have to be in the form : 
```typescript 
{
    Code: 400,
    Message: 'ERROR MESSAGE'
}
```
where Code is the error status of the request and Message is a text explaining the problem.

After that you just have to instantiate the class and start the server
```typescript 
const api = new ApifiedSample(2010);
api.start();
```

The only parameter (for now) of the class constructor is the port of the webserver.

After that you can call the api at : http://localhost:2010/test?data=titi

You can also find a list of all the available methods at : http://localhost:2010/routeslists


# Sockets
The library also contains a socket management part.
This is used the same way as the REST management. 

```typescript
import {VzSocketified, SOCKET_EVENT} from './index';

class Socket1 extends VzSocketified
{
    constructor(port: number)
    {
        super(port);
    }

    @SOCKET_EVENT()
    public connection(socket, self)
    {
        socket.emit('connected');
    }

    @SOCKET_EVENT()
    public test(data1: string, socket, self, data: {})
    {
        const data2 = self.innerTest(data1, data);
        socket.emit('test', data2);
    }

    private innerTest(data1: string, data: {})
    {
        return {datatest: data, data1test: data1};
    }
}

const socket = new Socket1(2010);

```

You can link a VzApified class to a VzSocket one to have the socket and the REST on the same port.

```typescript
import {VzApified, VzSocketified, SOCKET_EVENT} from './index';

import * as io from 'socket.io-client'


class RestApi extends VzApified
{
    [...]
}
class Socket1 extends VzSocketified
{
    constructor(api: VzApified)
    {
        super(api);
    }
    [...]
}

const api = new RestApi(2010);
const socket = new Socket(api);

```

# CAVEATS

To use vz-apified, you have to enable decorators by adding the following entry in the compiler options of the tsconfig.json:
```
"experimentalDecorators": true,
```

Because of the way tsc manage the decorator, if you want to call some method or field from the class you're using, in the api method description you have to add a "self" parameter.

For example:

```typescript
class ApifiedSample extends VzApified
{
    @GET_REST('Test api method')
    public Test(data: string, self: ApifiedSample)
    {
        return Promise.resolve(self.doSomeWork(data));
    }

    private doSomeWork(data: string)
    {
        [... do some work]
    }

}
```

That means that you can't make an api request using a self parameter. 


