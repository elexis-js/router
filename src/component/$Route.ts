import { $ContainerContentGroup, $Element, $ElementOptions } from "elexis";
import { $Page } from "./$Page";
import type { $Router } from "./$Router";

export interface $RouteOptions extends $ElementOptions {}
export class $Route<Path extends $RoutePathType | null = null, Params = any, Query = any> extends $Element {
    #path: Path | $RoutePathHandler = null as Path;
    #builder?: $RouteBuilder<Path, Params, Query>;
    readonly rendered: boolean = false;
    options = {
        static: true
    }
    constructor(options?: $RouteOptions) {
        super('route', options)
    }

    /**
     * Url path of page, base path depend on parent {@link $Router.base} method.
     * Support query and path parameter.
     * @params pathname - string start with '/', you can use array for multiple pathname point to single page.
     * @example
     * $('router').base('/me').map([
     *      // /me/about
     *      $('route').path('/about').builder(() => `Elexis Shizuka Nott's Page`);
     *      // /me/blog or /me/articles
     *      $('route').path(['/blog', '/articles']).builder($page => $page.content([...]));
     *      // /me/articles/42
     *      $('route').path('/articles/:articleId').builder($page => [ $('h1').content('Post ID: ' + $page.params.articleId) ]);
     *      // /me/greating?firstname=Higami&lastname=Amateras
     *      $('route').path('/greating?firstname&lastname').builder(({$page, query}) => $('p').content(`Hi! ${query.firstname} ${query.lastname}!`));
     * ])
     */
    path(): $RoutePathType | $RoutePathHandler;
    path<F extends $RoutePathHandler, R extends $RoutePathHandlerResolve<ReturnType<F>>>(resolver: F): $Route<any, R['params'], R['query']>
    path<P extends $RoutePathType>(pathname: P): $Route<P, P extends string ? PathParams<P> : {}, P extends string ? PathQuery<P> : {}>;
    path(resolver?: $RoutePathType | $RoutePathHandler): $RoutePathType | $Route<any, any, any> | $RoutePathHandler { return $.fluent(this, arguments, () => this.#path as any, () => {
        this.#path = resolver as Path ?? this.#path
    }) }

    /**
     * If set as false, URLs that meet the path conditions will use the same {@link $Page} object
     * @defaultValue `true`
     */
    static(): boolean;
    static(boolean: boolean): this;
    static(boolean?: boolean) { return $.fluent(this, arguments, () => this.options.static, () => $.set(this.options, 'static', boolean)) }

    builder(): $RouteBuilder<Path, Params, Query> | undefined;
    builder(builder?: $RouteBuilder<Path, Params, Query>): this;
    builder(builder?: $RouteBuilder<Path, Params, Query>) {
        if (!arguments.length) return this.#builder;
        this.#builder = builder;
        return this;
    }

    async build(options: {params: Params, query: Query}) {
        return await new $Page<any>(this, options.params, options.query).render()
    }

    /**
     * Apply configuration from $Route Object, support dynamic import with export default.
     * 
     * @param route - $Route
     * @example 
     * // dynamic import route
     * $('route').path('/home').from(() => import('./src/route/home.ts'))
     * 
     * // ./src/route/home.ts
     * const home_route = $('route').path('/home').builder(() => 'Hello, World!');
     * export default home_route;
     */
    from<R extends this>(route: R | Promise<R> | (() => Promise<{default: $Route<Path, Params, Query>}>)): this {
        this.#builder = async ($page) => {
            const $route = await route;
            if ($route instanceof $Route) {
                const builder = $route.builder();
                if (builder) return builder($page as any);
            } else {
                const builder = (await $route()).default.builder()
                if (builder) return builder($page as any);
            }
        }
        return this;
    }
}

export type $RouteBuilder<
    Path extends null | $RoutePathType, 
    Params, 
    Query
> = ($page: $Page<$Route<any, Params, Query>, Path, Params, Query>) => OrPromise<$Page<$Route<any, Params, Query>, Path, Params, Query> | $ContainerContentGroup>;
export type $RoutePathString = `/${string}` | `#${string}`;
export type $RoutePathType = $RoutePathString | $RoutePathString[];
type PathParams<Path> = Path extends `${infer Segment}/${infer Rest}`
    ? Segment extends `${string}:${infer Param}` 
        ? Record<Param, string> & PathParams<Rest> 
        : PathParams<Rest>
    : Path extends `${string}:${infer Param}?${infer Query}`
        ? Record<Param, string> 
    : Path extends `${string}:${infer Param}` 
        ? Record<Param, string> 
        : {}

type PathQuery<Path> = Path extends `${string}?${infer Segment}`
    ? PathQuery_SetRecord<Segment>
    : Path extends `&${infer Segment}`
        ? PathQuery_SetRecord<Segment>
        : {}

type PathQuery_SetRecord<Segment extends string> = Segment extends `${infer Param}&${infer Rest}` 
    ? Record<Param, string> & PathQuery<`&${Rest}`>
    : Record<Segment, string>

type $RoutePathHandlerResponse = { 
    params?: { [key: string]: string },
    query?: { [key: string]: string }
}
export type $RoutePathHandler = (path: string) => ($RoutePathHandlerResponse | undefined | false);

type $RoutePathHandlerResolve<R extends ReturnType<$RoutePathHandler>> = R extends $RoutePathHandlerResponse
    ? { params: Exclude<R['params'], undefined>, query: Exclude<R['query'], undefined> }
    : never