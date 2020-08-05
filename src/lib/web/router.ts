import { IRoute } from "./webservice";

export class VzRouter
{
    private baseRoute;
    constructor(baseRoute)
    {
        this.baseRoute = baseRoute;

        this.init();
    }

    private init()
    {
        if(this['__routes'])
        {
            const routes: IRoute[] = this['__routes'];
            for(let idx = 0; idx < routes.length; idx++)
            {
                routes[idx].Path = this.baseRoute + routes[idx].Path;
                routes[idx].Target = this;
            }
        }
    }

    public GetRoutes(): IRoute[]
    {
        if(this['__routes'])
        {
            return this['__routes'];
        }
        else 
        {
            return [];
        }
    }
}