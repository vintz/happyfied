
![npm](https://img.shields.io/npm/v/happyfied.svg)
![NPM](https://img.shields.io/npm/l/happyfied.svg)
![npm type definitions](https://img.shields.io/npm/types/happyfied.svg)
![npm](https://img.shields.io/npm/dt/happyfied.svg)
![npm bundle size](https://img.shields.io/bundlephobia/min/happyfied.svg)

```typescript
import {Happyfied, GET} from 'Happyfied';

class HappyfiedSample extends Happyfied
{
    @GET('Test api method')
    public Test(data: string)
    {
        return Promise.resolve({data: data, result: true});
    }
}

const api = new HappyfiedSample(2010);
api.start();

```

# Installation
This is a nodejs Typescript module.

Installation is done using the npm install command:

$ npm install happyfied

To use it, you have to enable decorators by adding the following entry in the compiler options of the tsconfig.json:
```
"experimentalDecorators": true,
```

# Quickstart

The first thing to do is to import the parent class and the decorators

```typescript
import {Happyfied, GET, POST} from 'Happyfied';
```

After that you have to create a class extending the Happyfied class. Any method that has a GET or POST decorator will be transformed into an API method with the same name and the same parameters.
The decorators are used as methods with a single parameter that should describe the API method

```typescript
class HappyfiedSample extends Happyfied
{
    @GET('Test api method')
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

The class methods can return a Promise, a string, a number or a JSON. 
If the return is a promise and the promise succeeds, the return can be  a string, a number or a JSON and it will be send to the caller with a 200 status. 
If the promise fails, the return have to be  a string, an error or a JSON in the form : 
```typescript 
{
    Code: 400,
    Message: 'ERROR MESSAGE'
}
```
where Code is the error status of the request and Message is a text explaining the problem.
If the failure return is just a string or an error, the return status will always be 400.

If the return is not a promise, the return will be send to the user with a 200 status.


After that you just have to instantiate the class and start the server
```typescript 
const api = new HappyfiedSample(2010);
api.start();
```

The class constructor has two parameters:
- the server port 
- A boolean that indicate if the app should use Express instead of the internal webserver. This parameter is optional. If it is not set, the app will use the internal server. If you want to use Express, you have to install it by yourself with the following command: 

$ npm install express

*Be aware that for the moment being, the internal server is much simpler and may be more buggy than Express.*


After that you can call the api at : http://localhost:2010/test?data=titi

You can also find a list of all the available methods at : http://localhost:2010/routeslists


# Sockets
The library also contains a socket management part.
This is used the same way as the REST management. 

```typescript
import {Socketified, SOCKET_EVENT} from './index';

class Socket1 extends Socketified
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

You can link a Happyfied class to a Socketified one to have the socket and the REST on the same port.

```typescript
import {Happyfied, Socketified, SOCKET_EVENT} from './index';

import * as io from 'socket.io-client'


class RestApi extends Happyfied
{
    [...]
}
class Socket1 extends Socketified
{
    constructor(api: Happyfied)
    {
        super(api);
    }
    [...]
}

const api = new RestApi(2010);
const socket = new Socket(api);

```

# CAVEATS

To use Happyfied, you have to enable decorators by adding the following entry in the compiler options of the tsconfig.json:
```
"experimentalDecorators": true,
```

Because of the way tsc manage the decorator, if you want to call some method or field from the class you're using, in the api method description you have to add a "self" parameter.

For example:

```typescript
class HappyfiedSample extends Happyfied
{
    @GET('Test api method')
    public Test(data: string, self: HappyfiedSample)
    {
        return self.doSomeWork(data);
    }

    private doSomeWork(data: string)
    {
        [... do some work]
    }

}
```

That means that you can't make an api request using a self parameter. 

Happyfied can now be used without the express dependency. If you want to use Happyfied with Express, you have to install Express manually 
```bash
npm install express
```

After that, you have to call the Happyfied constructor with a second parameter as true

```typescript

class HappyfiedSample extends Happyfied
{
    constructor(port: number)
    {
        super(port, true); // the second parameter indicate if the Happyfied class should use Express instead of the internal "webserver"
    }
}

```


