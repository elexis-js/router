import { $Container, $ContainerOptions } from "elexis";
import { $Page } from "./$Page";

export interface $RouteOptions extends $ContainerOptions {}
export class $Route<Path extends null | $RoutePathType = null, Params = any, Query = any> extends $Container<HTMLElement> {
    #path: $RoutePathType = '';
    #builder?: $RouteBuilder<this, Path, Params, Query>;
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

    builder(): $RouteBuilder<this, Path, Params, Query> | undefined;
    builder(builder?: $RouteBuilder<this, Path, Params, Query>): this;
    builder(builder?: $RouteBuilder<this, Path, Params, Query>) {
        if (!arguments.length) return this.#builder;
        this.#builder = builder;
        return this;
    }

    build(options: {params: Params, query: Query}) {
        return new $Page(this).render({params: options.params as any, query: options.query as any})
    }
}

export type $RouteBuilder<_$Route extends $Route, Path extends null | $RoutePathType, Params, Query> = (record: $RouteRecord<Path, Params, Query>) => OrPromise<$Page<_$Route, Path, Params, Query>>;


export interface $RouteRecord<Path extends null | $RoutePathType, Params, Query> {
    $page: $Page<$Route<Path, Params, Query>, Path, Params, Query>;
    params: Params;
    query: Query;
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