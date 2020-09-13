import { ISendFileInfo } from "../web/happyfied";
import { ISendFileOptions } from "./innerwebservice";

import {HappyServer} from './innerwebservice';
import { RouteType } from '../web/happyfied';

const ws = new HappyServer(2001);
ws.AddRoute(RouteType.GET, '/toto', (req, res, next)=>
{
    if (req['titi'])
    {
        res.Respond(400, 'pas bon');
    }
    else 
    {
        res.Respond(200, '/toto found');
    }
    
})

ws.AddRoute(RouteType.USE, null, (req, res, next) =>
{
    req['titi'] = 'OK';
    next();
})

ws.AddRoute(RouteType.GET, '/titi', (req, res, next) =>
{
    if (req['titi'])
    {
        res.Respond(200, req['titi']);
    }
    else 
    {
        res.Respond(400, 'CRASHED');
    }
})

ws.AddRoute(RouteType.POST, '/tutu', (req, res, next) =>
{
    res.Respond(200, '/tutu found');
})

ws.AddRoute(RouteType.GET, '/tata', (req, res, next) =>
{
    res.Respond(200, '/tata found');
})

console.log('server started');



import { Happyfied, GET, BEFORE, USE } from "../..";

class TestApi extends Happyfied
{
    @GET('Test simple GET api')
    public Test()
    {
        return Promise.resolve('ok 1');
    }

    @GET('Test simple GET api with URI parameters', ['id1', 'id2'])
    public Test2(id1, id2)
    {
      return Promise.resolve(id1+ ' / ' + id2);
    }

    @GET('Test simple GET api with GET parameters')
    public Test3(id1, id2)
    {
        return Promise.resolve(id1+ ' / ' + id2);
    }

    @GET('Test before middleware')
    public TestBefore(result)
    {
      return Promise.resolve(result);
    }

    @BEFORE('Test middleware')
    public TestMiddleware(id3)
    {
      return Promise.resolve({result:(id3 + '_test')})
    }

    @GET('Test after middleware')
    public TestAfter(result)
    {
      return Promise.resolve(result);
    }

    @USE('Static call', {wildcard: true, static: './pub'})
    public Public(self: Happyfied)
    {
     
    }

    @USE('Static call', { static: './pub'})
    public TestFile(self: Happyfied)
    {
      return Promise.resolve('toto.txt');
    }


}

const tmp = new TestApi(2010, false);
tmp.Start();
console.log('server 2 started')/**/
/*import * as Path from 'path';

const test = (path: string, options: ISendFileOptions) =>
{
    if (options && options.root)
    {
        let finalPath = Path.join(options.root, path);
        finalPath = Path.normalize(finalPath);
        const root = Path.normalize(options.root);
        if (finalPath.indexOf(root) == 0)
        {
            return finalPath;
        }
        else 
        {
            return null;
        }
    }
    else 
    {
        return Path.normalize(path);
    }

    
}


console.log(test('toto.txt', {root: 'titi'}));
console.log(test('tutu/toto.txt', {root: 'titi'}));
console.log(test('tutu/toto.txt', {root: 'titi/tata'}));
console.log(test('../tutu/toto.txt', {root: 'titi/tata'}));
console.log(test('../toto.txt', {root: 'titi'}));
console.log(test('../../toto.txt', {root: 'titi'}));
/* */