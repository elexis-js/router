import { $Container, $ContainerContentType, $ContainerEventMap, $ContainerOptions, $EventManager } from "elexis";

export interface $RouteOptions extends $ContainerOptions {}
export class $Route<Path extends null | $RoutePathType = null, Params = any, Query = any, EM extends $RouteEventMap = $RouteEventMap<Path, Params, Query>> extends $Container<HTMLElement, EM> {
    #path: $RoutePathType = '';
    #builder?: (record: $RouteRecord<Path, Params, Query>) => OrMatrix<$ContainerContentType>;
    readonly rendered: boolean = false;
    constructor(options?: $RouteOptions) {
        super('route', options);
        this.__$property__.static = true;
    }

    path(): $RoutePathType;
    path<P extends $RoutePathType>(pathname: P): $Route<P, P extends string ? PathParams<P> : {}, P extends string ? PathQuery<P> : {}>;
    path(pathname?: $RoutePathType): $RoutePathType | $Route<any, any> { return $.fluent(this, arguments, () => this.#path, () => this.#path = pathname ?? this.#path ) }

    static(): boolean;
    static(boolean: boolean): this;
    static(boolean?: boolean) { return $.fluent(this, arguments, () => this.__$property__.static, () => $.set(this.__$property__, 'static', boolean)) }

    builder(builder: (record: $RouteRecord<Path, Params, Query>) => OrMatrix<$ContainerContentType>) {
        this.#builder = builder;
        return this;
    }

    render(options: {params: Params, query: Query}) {
        if (this.#builder) this.content(this.#builder({
            $route: this,
            params: options.params,
            query: options.query
        }));
        (this as Mutable<$Route>).rendered = true;
        return this;
    }

    build(options: {params: Params, query: Query}) {
        return new $Route({dom: this.dom.cloneNode() as HTMLElement}).self(($route) => {
            if (this.#builder) $route.builder(this.#builder as any).render({params: options.params as any, query: options.query as any})
        })
    }
}

export interface $RouteRecord<Path extends null | $RoutePathType, Params, Query> {
    $route: $Route<Path, Params, Query>;
    params: Params
    query: Query
}
export interface $RouteEventMap<Path extends null | $RoutePathType = null, Params = any, Query = any> extends $ContainerEventMap {
    rendered: [$RouteRecord<Path, Params, Query>];
    beforeShift: [{$route: $Route}];
    afterShift: [{$route: $Route}];
    open: [$RouteRecord<Path, Params, Query>];
    close: [{$route: $Route}];
}
export type $RoutePathType = string | string[];
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