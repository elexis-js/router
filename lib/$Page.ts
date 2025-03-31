import { $Container, $ContainerEventMap } from "elexis";
import { $Route, $RoutePathType } from "./$Route";

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
    $page = this;
    constructor($route: _$Route, params: Params, query: Query) {
        super('page');
        this.$route = $route;
        this.params = params;
        this.query = query;
    }

    render() {
        const builder = this.$route.builder();
        if (builder) {
            const result = builder(this);
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