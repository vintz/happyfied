import {VzApified, GET} from '../src/index';

import * as Http from 'http';
import { tmpdir } from 'os';
import { USE } from '../src/lib/web/webservice';

class TestApi extends VzApified
{
    @GET('Test simple GET api')
    public Test()
    {
        return Promise.resolve('ok');
    }

    @GET('Test simple GET api with URI parameters', ['id1', 'id2'])
    public Test2(id1, id2)
    {
      return Promise.resolve('ok');
    }

    @GET('Test simple GET api with GET parameters')
    public Test3(id1, id2)
    {
      return Promise.resolve('ok');
    }

    @GET('Test before middleware')
    public TestBefore(result)
    {
      return Promise.resolve(result);
    }

    @USE('Test middleware')
    public TestMiddleware(id3)
    {
      return Promise.resolve({result:(id3 + '_test')})
    }

    @GET('Test after middleware')
    public TestAfter(result)
    {
      return Promise.resolve(result);
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
  if (((res.statusCode == 200) == shouldWork) && ((!expectedBody || expectedBody.toLowerCase() == res.body.toLowerCase()) ))
  {
    done();
  }
  else 
  {
    done(new Error(res.body));
  }
}

let tmp: TestApi;
before(()=>
{
  tmp = new TestApi(1999);
  tmp.Start();

})

describe('Test simple GET api generation', () => {
  it('should create a simple page', (done) => 
  {
    Http.get('http://localhost:1999/test', (res)=>
    {
       httpCallBack(res,  (res2) => standardTest(res2, true, null, done));
    })
  });

  it('should not get response on not existing uri', (done) => 
  {
    Http.get('http://localhost:1999/failed', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, false, null, done));
    })
  });
});

describe('Test simple GET api generation with uri parameters', () => {
  it('should respond to a full uri (with 2 parameters)', (done) => 
  {
    Http.get('http://localhost:1999/test2/a1/a2', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, true, null, done));
    })
  });

  it('should not get response on incorrect uri (not enough uri parameters)', (done) => 
  {
    Http.get('http://localhost:1999/test2/a1', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, false, null, done));
    })
  });
});

describe('Test simple GET api generation with uri parameters', () => {
  it('should respond to a uri with 2 parameters correctly named', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto&id2=titi', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, true, null,  done));
    })
  });

  it('should not get response on wrong parameters', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto&id3=titi', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
    })
  });

  it('should not get response with missing parameters', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
    })
  });
});

describe('Test middleware params injection before', () => {
  it('should respond with an error', (done) => 
  {
    Http.get('http://localhost:1999/testbefore?id3=toto', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, false, 'MISSING_PARAMETER', done));
    })
  });

  it('should respond with the value of id3 concatenate with  _test', (done) => 
  {
    Http.get('http://localhost:1999/testafter?id3=toto', (res)=>
    {
      httpCallBack(res,  (res2) => standardTest(res2, true, 'toto_test', done));
    })
  });
});


after(()=>
{
  tmp.Stop();
})