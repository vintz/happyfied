# Routing

Routing refers to the creation of application's endpoints.
You define routings by adding a typescript decorator to a class method. There are many decorators corresponding to HTTP methods (POST, GET, etc.)

For example, if you want to add a simple GET request: 

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
     @GET('Contatenate two strings')
     public Concatenate(first: string, second: string)
     {
         return Promise.resolve(first+second);
     } 
}

const test = new TestApified(2010);
test.Start();
```



There is also a global decorator 'USE' that can be used as wildcard for all the methods.

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
     @USE('Contatenate two strings')
     public Concatenate(first: string, second: string)
     {
         return Promise.resolve(first+second);
     } 
}

const test = new TestApified(2010);
test.Start();


```

With the previous code example, you can make a POST or a GET request to the http://localhost:2010/Concatenate and you'll get the same response. 

The "BEFORE"  decorator adds a middleware that can't be called directly but we'll be checked when an existing route is called. It is good to know that the routes and middleware are checked in the order they are in the class.

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
     @BEFORE('Is used logged middleware')
     public IsUserLogged()
     {
     	if ()   
     }
     @GET('Contatenate two strings')
     public Concatenate(first: string, second: string)
     {
         return Promise.resolve(first+second);
     } 
}

const test = new TestApified(2010);
test.Start();
```



## Using routers

A router is a good way to keep together multiple requests that are linked by a same theme.
For example, if you are creating an api that manage accounts and actions on devices, you would probably create one server and two routers: one for the accounts and one for the actions on devices.


```typescript
import {Happyfied, HappyRouter, GET, POST} from 'happyfied';

class AccountRouter extends HappyRouter
{
     constructor()
     {
         super('/account');
     }

     @POST('User login')
     public Login(user: string, password: string)
     {
         [...]
     }

     @POST('User logout')
     public Logout(token: string)
     {
         [...]
     }

     @POST('Edit user settings')
     public EditSettings(token: string, settings: {})
     {
         [...]
     }
}

class DeviceRouter extends HappyRouter
{
     constructor()
     {
         super('/device');
     }

     @POST('Turn on device')
     public TurnOn(token: string, deviceid: string)
     {
         [...]
     }

     @POST('Turn off device')
     public TurnOff(token: string, deviceid: string)
     {
         [...]
     }
}

const test = new Happyfied(2010);
const acRouter = new AccountRouter();
const dvRouter = new DeviceRouter();
test.AddRouter(acRouter);
test.AddRouter(dvRouter);
test.Start();
```

With this code, you'll have the following possible URI:
* http://localhost:2010/account/login
* http://localhost:2010/account/logout
* http://localhost:2010/account/editsettings
* http://localhost:2010/device/turnon
* http://localhost:2010/device/turnoff



## Route options

When you add the decorator to the class method, there is two parameters:

- the first one is as seen before the description of the request
- the second one is optional and contains all the options for the current request. The following table describes the properties of the options object

| Property | Type          | Description                                                  | Default |
| -------- | ------------- | ------------------------------------------------------------ | ------- |
| params   | Array<string> | List of the uri params that can be used in the method.       | null    |
| static   | string        | If static is defined, the route returns the content of a file found into a folder defined by the "static" value. | null    |
| wildcard | boolean       | If wildcard is true, the request is parsed as if the route path ends with a wildcard | false   |

### params

The params property defines the URL segments used to capture the values specified at their position in the URL. 

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
     @GET('Contatenate two strings', ['first', 'second'])
     public Concatenate(first: string, second: string, testId: string, testId2: string)
     {
         return Promise.resolve(first + ' : ' + second);
     }
}

const test = new TestApified(2010);
test.Start();
```

If you call http://localhost:2010/Concatenate/Titi/toto?testId=Test1&testId2=second, you'll receive the following answer:
```
Titi : toto
```

### static

The static property is the path of the folder from which the server should serve a file when the route is called.  
When using the static property, the linked method is intended to return one of the following result: 

- the path of the file to be served
- a promise returning the path of the file to be served. If the promise is rejected, the server will return the error.
- null or a promise returning null. If so, the server will try to serve a file by parsing the request URI.

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
    [...]
     @GET('Send a file', {static:'./pub', wildcard: true})
     public Public(self: Happyfied, test: boolean)
     {
         if (test)
         {
             return Promise.resolve('file.txt')
         }
         else 
         {
         	return Promise.resolve(null);    
         }
     }
}

const test = new TestApified(2010);
test.Start();
```

If you call http://localhost:2010/public/titi/tutu.txt and if the test variable is set to true(probably by a previously called middleware), the user will receive the content of ./pub/file.txt.

If you call http://localhost:2010/public/titi/tutu.txt and  the test variable is false, the user will receive the content of ./pub/titi/tutu.txt (if it exists).

### wildcard

The wildcard property defines that the route can be called with a wildcard at the end.  

```typescript
import {Happyfied, GET} from 'happyfied';

class TestApified extends Happyfied
{
    [...]
     @GET('Test wildcard', {wildcard: true})
     public Test(self: Happyfied)
     {
         return 'test ok'
     }
}

const test = new TestApified(2010);
test.Start();
```

For example, the path defined in the previous code can be accessed using anything that  follows the '/test' URL (for example, if you wanted to build a “catch all”  that caught routes not previously defined). Calling http://localhost:2010/test, http://localhost:2010/test/step2 or http://localhost:2010/test/step2/step3/step4/step5 will return the same answer :  test ok





