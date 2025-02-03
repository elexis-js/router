import { $Container, $ContainerEventMap } from "elexis";
import { $Route, $RoutePathType, $RouteRecord } from "./$Route";

export class $Page<_$Route extends $Route = $Route, Path extends null | $RoutePathType = null, Params = any, Query = any, EM extends $PageEventMap = $PageEventMap<Path, Params, Query>> extends $Container<HTMLElement, EM> {
    $route: _$Route;
    readonly rendered: boolean = false;
    constructor($route: _$Route) {
        super('page');
        this.$route = $route;
    }

    render(options: {params: Params, query: Query}) {
        const builder = this.$route.builder();
        if (builder) builder({
            $page: this,
            params: options.params,
            query: options.query
        });
        (this as Mutable<$Page>).rendered = true;
        return this;
    }
}

export interface $PageEventMap<Path extends null | $RoutePathType = null, Params = any, Query = any> extends $ContainerEventMap {
    rendered: [$RouteRecord<Path, Params, Query>];
    beforeShift: [{$page: $Page}];
    afterShift: [{$page: $Page}];
    open: [$RouteRecord<Path, Params, Query>];
    close: [{$page: $Page}];
}