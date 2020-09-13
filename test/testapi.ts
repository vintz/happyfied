import { TestApi, launchTest } from "./testapiDef";

let tmp: TestApi;
describe('TEST WITH INTERNAL "WEBSERVER"', () =>
{
    before(()=>
    {
    tmp = new TestApi(1999);
    tmp.Start();

    })
    launchTest();
    after(()=>
    {
    tmp.Stop();
    })
});

describe('TEST WITH EXPRESS', () =>
{
    before(()=>
    {
    tmp = new TestApi(1999, true);
    tmp.Start();

    })
    launchTest();
    after(()=>
    {
    tmp.Stop();
    })
});
