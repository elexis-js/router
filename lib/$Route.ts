import { $Container, $ContainerContentType, $ContainerOptions, $EventManager } from "elexis";

export interface $RouteOptions extends $ContainerOptions {}
export class $Route<Path = PathParams<''>> extends $Container {
    #path: $RoutePathType = '';
    #builder?: (record: $RouteRecord<Path>) => OrMatrix<$ContainerContentType>;
    events = new $EventManager<$RouteEventMap>().register('opened', 'closed')
    readonly rendered: boolean = false;
    constructor(options?: $RouteOptions) {
        super('route', options);
    }

    path(): $RoutePathType;
    path<P extends $RoutePathType>(pathname: P): $Route<P extends string ? PathParams<P> : ''>;
    path(pathname?: $RoutePathType): $RoutePathType | $Route<any> { return $.fluent(this, arguments, () => this.#path, () => this.#path = pathname ?? this.#path ) }

    builder(builder: (record: $RouteRecord<Path>) => OrMatrix<$ContainerContentType>) {
        this.#builder = builder;
        return this;
    }

    render(options: {params: Path}) {
        if (this.#builder) this.content(this.#builder({
            $route: this,
            params: options.params
        }));
        (this as Mutable<$Route<Path>>).rendered = true;
        return this;
    }

    build(options: {params: Path}) {
        return new $Route({dom: this.dom.cloneNode() as HTMLElement}).self(($route) => {
            if (this.#builder) $route.builder(this.#builder as any).render({params: options.params as any})
        })
    }
}

interface $RouteRecord<Path> {
    $route: $Route<Path>;
    params: Path
}
interface $RouteEventMap {
    opened: [];
    closed: []
}
export type $RoutePathType = string | string[];
type PathParams<Path> = Path extends `${infer Segment}/${infer Rest}`
    ? Segment extends `${string}:${infer Param}` ? Record<Param, string> & PathParams<Rest> : PathParams<Rest>
    : Path extends `${string}:${infer Param}` ? Record<Param,string> : {}