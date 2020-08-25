import {VzApified, GET_REST} from '../src/index';

import * as Http from 'http';
import { tmpdir } from 'os';

class TestApi extends VzApified
{
    @GET_REST('Test simple GET api')
    public Test()
    {
        return Promise.resolve('ok');
    }

    @GET_REST('Test simple GET api with URI parameters', ['id1', 'id2'])
    public Test2(id1, id2)
    {
      return Promise.resolve('ok');
    }

    @GET_REST('Test simple GET api with GET parameters')
    public Test3(id1, id2)
    {
      return Promise.resolve('ok');
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
       if (res.statusCode == 200)
       {
         done();
       }
    })
  });

  it('should not get response on not existing uri', (done) => 
  {
    Http.get('http://localhost:1999/failed', (res)=>
    {
       if (res.statusCode != 200)
       {
         done();
       }
    })
  });
});

describe('Test simple GET api generation with uri parameters', () => {
  it('should respond to a full uri (with 2 parameters)', (done) => 
  {
    Http.get('http://localhost:1999/test2/a1/a2', (res)=>
    {
       if (res.statusCode == 200)
       {
         done();
       }
    })
  });

  it('should not get response on incorrect uri (not enough uri parameters)', (done) => 
  {
    Http.get('http://localhost:1999/test2/a1', (res)=>
    {
       if (res.statusCode != 200)
       {
         done();
       }
    })
  });
});

describe('Test simple GET api generation with uri parameters', () => {
  it('should respond to a uri with 2 parameters correctly named', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto&id2=titi', (res)=>
    {
       if (res.statusCode == 200)
       {
         done();
       }
    })
  });

  it('should not get response on wrong parameters', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto&id3=titi', (res)=>
    {
       if (res.statusCode != 200)
       {
         done();
       }
    })
  });

  it('should not get response with missing parameters', (done) => 
  {
    Http.get('http://localhost:1999/test3?id1=toto', (res)=>
    {
       if (res.statusCode != 200)
       {
         done();
       }
    })
  });
});

after(()=>
{
  tmp.Stop();
})