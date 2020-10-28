import {Happyfied, GET, USE, BEFORE, POST, HEAD, PUT, DELETE, PATCH } from '../src/index';

import * as Http from 'http';

export class TestApi extends Happyfied
{
    @GET('Main call')
    public _()
    {
      return 'base';
    }
    
    @GET('Test simple GET api')
    public Test()
    {
        return 'ok 1';
    }

    @GET('Test simple GET api with URI parameters', ['id1', 'id2'])
    public Test2(id1, id2)
    {
      return 'ok 2';
    }

    @GET('Test simple GET api with GET parameters')
    public Test3(id1, iD2)
    {
      return 'ok 3';
    }

    @GET('Test before middleware')
    public TestBefore(result)
    {
      return result;
    }

    @BEFORE('Test middleware')
    public TestMiddleware(id3)
    {
      return {result:(id3 + '_test')};
    }

    @GET('Test after middleware')
    public TestAfter(result)
    {
      return result;
    }

    @USE('Static call', {wildcard: true, static: './test/pub'})
    public Public(self: Happyfied)
    {
     
    }

    @USE('Static call', { static: './test/pub'})
    public TestFile(self: Happyfied)
    {
      return 'toto.txt';
    }

    @POST('Test post call with parameters')
    public TestPost(self: Happyfied, param1: string, param2: string)
    {
      return {
        param1: param1,
        param2: param2,
        result: param2 + '/' + param1
      };
    }

    @HEAD('Test Head with parameters')
    public TestHead(self: Happyfied, param1: string, param2: string)
    {
      return {
        param1: param1,
        param2: param2,
        result: param2 + '/' + param1
      };
    }

    @PUT('Test Put with parameters')
    public TestPut(self: Happyfied, param1: string, param2: string)
    {
      return {
        param1: param1,
        param2: param2,
        result: param2 + '/' + param1
      };
    }

    @DELETE('Test Delete with parameters')
    public TestDelete(self: Happyfied, param1: string, param2: string)
    {
      return {
        param1: param1,
        param2: param2,
        result: param2 + '/' + param1
      };
    }

    @PATCH('Test Patch with parameters')
    public TestPatch(self: Happyfied, param1: string, param2: string)
    {
      return {
        param1: param1,
        param2: param2,
        result: param2 + '/' + param1
      };
    }

    @USE('Test multimethod with parameters')
    public TestUse(self: Happyfied, _method: string)
    {
      return _method
    }

    @GET('Test error with simple string return')
    public Error1()
    {
      return Promise.reject('CRASHED');
    }

    @GET('Test error with IWSError (error status 418 / message "I\'m a teapot"')
    public Error2()
    {
      return Promise.reject({Code: 418, Message:"I'm a teapot"});
    }

    @GET('Test error with Error (error status 400 / message "ERROR" + stack')
    public Error3()
    {
      return Promise.reject(new Error('ERROR'));
    }


}

const httpCallBack = (res: Http.IncomingMessage, done: (myRes: {statusCode: number, body: string} ) => void) =>
{

  let body = '';
  let ok = false
  res.on('data', (data)=> { body += data;})
  res.on('end', ()=>
  {
    if (!ok)
    {
      done({statusCode: res.statusCode, body: body});
    }
  })
}

const standardTest = (res: {statusCode: number, body: string}, shouldWork: boolean,  expectedBody: string, done: (err?: Error) => void) =>
{
 
  if (((res.statusCode == 200) == shouldWork) && ((!expectedBody || expectedBody.toLowerCase() == res.body.toLowerCase())))
  {
    done();
  }
  else 
  {
    done(new Error(res.body));
  }
}

const errorTest = (res: {statusCode: number, body: string}, errorCode: number,  expectedBody: string, done: (err?: Error) => void, errorStartswith?: boolean) =>
{
 
  let expectedbodyResult: boolean = false;
  if (errorStartswith)
  {
    expectedbodyResult = res.body.toLowerCase().startsWith(expectedBody.toLowerCase())
  }
  else 
  {
    expectedbodyResult = ( expectedBody.toLowerCase() == res.body.toLowerCase());
  }
  if ((res.statusCode == errorCode)  && expectedbodyResult)
  {
    done();
  }
  else 
  {
    done(new Error(res.body));
  }
}

export function launchTest()
{
  describe('Test simple GET api generation', () => {
    it('should create a simple page (http://localhost:1999/)', (done) => 
    {
      Http.get('http://localhost:1999/', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'base', done));
      })
    });

    it('should create a simple page (http://localhost:1999/test)', (done) => 
    {
      Http.get('http://localhost:1999/test', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, null, done));
      })
    });

    it('should not get response on not existing uri (http://localhost:1999/failed)', (done) => 
    {
      Http.get('http://localhost:1999/failed', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, null, done));
      })
    });
  });

  describe('Test simple GET api generation with uri parameters', () => {
    it('should respond to a full uri (with 2 parameters) (http://localhost:1999/test2/a1/a2)', (done) => 
    {
      Http.get('http://localhost:1999/test2/a1/a2', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, null, done));
      })
    });

    it('should not get response on incorrect uri (not enough uri parameters) (http://localhost:1999/test2/a1)', (done) => 
    {
      Http.get('http://localhost:1999/test2/a1', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, null, done));
      })
    });
  });

  describe('Test simple GET api generation with uri parameters', () => {
    it('should respond to a uri with 2 parameters correctly named (http://localhost:1999/test3?id1=toto&Id2=titi)', (done) => 
    {
      Http.get('http://localhost:1999/test3?id1=toto&Id2=titi', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, null,  done));
      })
    });

    it('should not get response on wrong parameters (http://localhost:1999/test3?id1=toto&id3=titi)', (done) => 
    {
      Http.get('http://localhost:1999/test3?id1=toto&id3=titi', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
      })
    });

    it('should not get response with missing parameters (http://localhost:1999/test3?id1=toto)', (done) => 
    {
      Http.get('http://localhost:1999/test3?id1=toto', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
      })
    });
  });

  describe('Test middleware params injection before', () => {
    it('should respond with an error (http://localhost:1999/testbefore?id3=toto)', (done) => 
    {
      Http.get('http://localhost:1999/testbefore?id3=toto', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
      })
    });

    it('should respond with the value of id3 concatenate with  _test (http://localhost:1999/testafter?id3=toto)', (done) => 
    {
      Http.get('http://localhost:1999/testafter?id3=toto', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'toto_test', done));
      })
    });
  });

  describe('Test static files call', () => {
    it('should respond with a file (http://localhost:1999/public/toto.txt)', (done) => 
    {
      Http.get('http://localhost:1999/public/toto.txt', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'titi', done));
      })
    });

    it('should respond with a 404 error (http://localhost:1999/public/titi.txt)', (done) => 
    {
      Http.get('http://localhost:1999/public/titi.txt', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, 'FILE_NOT_FOUND', done));
      })
    });

    it('should respond with the content of toto.txt (titi) (http://localhost:1999/TestFile)', (done) => 
    {
      Http.get('http://localhost:1999/TestFile', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'titi', done));
      })
    });
    
  });

  describe('Test POST call', () => {
    it('should respond with a JSON (http://localhost:1999/testpost)', (done) => 
    {
      const data = JSON.stringify({
        param1: 'Buy the milk',
        param2: "Don't forget the bread"
      })
      const options = 
      {
        method:"POST", headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }}
      const req =  Http.request('http://localhost:1999/testpost', options, (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, null, done));
      })
      req.write(data)
    });


    it('should respond with a missing parameter error (http://localhost:1999/testpost)', (done) => 
    {
      const data = JSON.stringify({
        param1: 'Buy the milk',
        param3: "Don't forget the bread"
      })
      const options = 
      {
        method:"POST", headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }}
      const req =  Http.request('http://localhost:1999/testpost', options, (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
      })
      req.write(data)
    });
  });

  describe('Test Http method management', () => {
    it('should respond with "GET" (http://localhost:1999/testuse)', (done) => 
    {
      
      Http.get('http://localhost:1999/testuse', (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'GET', done));
      })
    });

    it('should respond with "POST" (http://localhost:1999/testuse)', (done) => 
    {
      const data = JSON.stringify({
        param1: 'Buy the milk',
        param3: "Don't forget the bread"
      })
      const options = 
      {
        method:"POST", headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }}
      const req =  Http.request('http://localhost:1999/testuse', options, (res)=>
      {
        httpCallBack(res,  (res2) => standardTest(res2, true, 'POST', done));
      })
      req.write(data)
    });


  })

  describe('Test Error management', () => {
    it('should respond with a 400 status and error "CRASHED" (http://localhost:1999/error1)', (done) => 
    {
      
      Http.get('http://localhost:1999/error1', (res)=>
      {
        httpCallBack(res,  (res2) => errorTest(res2, 400, 'CRASHED', done));
      })
    });

    it('should respond with a 418 status and error "I\'m a teapot" (http://localhost:1999/error2)', (done) => 
    {
      
      Http.get('http://localhost:1999/error2', (res)=>
      {
        httpCallBack(res,  (res2) => errorTest(res2, 418,  "I'm a teapot", done));
      })
    });

    it('should respond with a 400 status and error "ERROR" and the full stack (http://localhost:1999/error3)', (done) => 
    {
      
      Http.get('http://localhost:1999/error3', (res)=>
      {
        httpCallBack(res,  (res2) => errorTest(res2, 400,  "ERROR", done, true));
      })
    });

  });
}