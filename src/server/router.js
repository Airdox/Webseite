export class Router {
    constructor() {
        this.routes = [];
    }

    get(path, handler) {
        this.routes.push({ method: 'GET', path, handler });
    }

    post(path, handler) {
        this.routes.push({ method: 'POST', path, handler });
    }

    async handle(request, env, ctx) {
        const url = new URL(request.url);
        const { pathname } = url;
        const { method } = request;

        for (const route of this.routes) {
            if (route.method === method && route.path === pathname) {
                return route.handler(request, env, ctx);
            }
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
