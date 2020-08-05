

```javascript
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

```javascript
import {VzApified, GET_REST, POST_REST} from 'vz-apified';
```

After that you have to create a class extending the VzApified class. Any method that has a GET_REST or POST_REST decorator will be transformed into an API method with the same name and the same parameters.
The decorators are used as methods with a single parameter that should describe the API method

```javascript
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
```javascript 
{
    Code: 400,
    Message: 'ERROR MESSAGE'
}
```
where Code is the error status of the request and Message is a text explaining the problem.

After that you just have to instantiate the class and start the server
```javascript 
const api = new ApifiedSample(2010);
api.start();
```

The only parameter (for now) of the class constructor is the port of the webserver.

After that you can call the api at : http://localhost:2010/test?data=titi

You can also find a list of all the available methods at : http://localhost:2010/routeslists
