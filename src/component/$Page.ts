import { type $ContainerEventMap, $Container } from "elexis/src/node/$Container";
import { $Route, type $RoutePathType } from "./$Route";

export class $Page <
    _$Route extends $Route = $Route, 
    Path extends null | $RoutePathType = null, 
    Params = any, 
    Query = any, 
    EM extends $ContainerEventMap = $PageEventMap<$Page<_$Route, Path, Params, Query, never>>
> extends $Container<HTMLElement, EM> {
    readonly rendered: boolean = false;
    $route: _$Route;
    params: Params;
    query: Query;
    base: string;
    $page = this;
    pathId: string;
    constructor($route: _$Route, params: Params, query: Query, pathId: string, base: string) {
        super('page');
        this.$route = $route;
        this.params = params;
        this.query = query;
        this.base = base;
        this.pathId = pathId;
    }

    async render() {
        const builder = this.$route.builder();
        if (builder) {
            const result = await builder(this);
            if (result instanceof Promise) result.then($element => $element === this ? undefined : this.content($element));
            else result === this ? undefined : this.content(result)
        }
        (this as Mutable<$Page>).rendered = true;
        return this;
    }
}

export interface $PageEventMap <
    $$Page extends $Page
> extends $ContainerEventMap {
    rendered: [$$Page];
    beforeShift: [$$Page];
    afterShift: [$$Page];
    open: [$$Page];
    close: [$$Page];
}