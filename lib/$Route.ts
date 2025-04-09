import { $ContainerContentGroup, $Element, $ElementOptions } from "elexis";
import { $Page } from "./$Page";

export interface $RouteOptions extends $ElementOptions {}
export class $Route<Path extends null | $RoutePathType = null, Params = any, Query = any> extends $Element {
    #path: $RoutePathType = '';
    #builder?: $RouteBuilder<this, Path, Params, Query>;
    readonly rendered: boolean = false;
    options = {
        static: true
    }
    constructor(options?: $RouteOptions) {
        super('route', options)
    }

    path(): $RoutePathType;
    path<P extends $RoutePathType>(pathname: P): $Route<P, P extends string ? PathParams<P> : {}, P extends string ? PathQuery<P> : {}>;
    path(pathname?: $RoutePathType): $RoutePathType | $Route<any, any> { return $.fluent(this, arguments, () => this.#path, () => this.#path = pathname ?? this.#path ) }

    /**
     * If set as false, URLs that meet the path conditions will use the same {@link $Page} object
     * @defaultValue `true`
     */
    static(): boolean;
    static(boolean: boolean): this;
    static(boolean?: boolean) { return $.fluent(this, arguments, () => this.options.static, () => $.set(this.options, 'static', boolean)) }

    builder(): $RouteBuilder<this, Path, Params, Query> | undefined;
    builder(builder?: $RouteBuilder<this, Path, Params, Query>): this;
    builder(builder?: $RouteBuilder<this, Path, Params, Query>) {
        if (!arguments.length) return this.#builder;
        this.#builder = builder;
        return this;
    }

    build(options: {params: Params, query: Query}) {
        return new $Page(this, options.params, options.query).render()
    }
}

export type $RouteBuilder<$$Route extends $Route, Path extends null | $RoutePathType, Params, Query> = ($page: $Page<$$Route, Path, Params, Query>) => OrPromise<$Page<$$Route, Path, Params, Query> | $ContainerContentGroup>;

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