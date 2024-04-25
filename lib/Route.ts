import { $EventMethod, $Node, $EventManager } from "elexis";
import { $Util } from "elexis/lib/$Util";

export class Route<Path extends string | PathResolverFn> {
    path: string | PathResolverFn;
    builder: (req: RouteRequest<Path>) => RouteContent;
    constructor(path: Path, builder: ((req: RouteRequest<Path>) => RouteContent) | RouteContent) {
        this.path = path;
        this.builder = builder instanceof Function ? builder : (req: RouteRequest<Path>) => builder;
    }
}

type PathParams<Path> = Path extends `${infer Segment}/${infer Rest}`
    ? Segment extends `${string}:${infer Param}` ? Record<Param, string> & PathParams<Rest> : PathParams<Rest>
    : Path extends `${string}:${infer Param}` ? Record<Param,string> : {}

export type PathResolverFn = (path: string) => undefined | string;

type PathParamResolver<P extends PathResolverFn | string> = P extends PathResolverFn
? undefined : PathParams<P>

// type PathResolverRecord<P extends PathResolverFn> = {
//     [key in keyof ReturnType<P>]: ReturnType<P>[key]
// }


export interface RouteRecord extends $EventMethod<RouteRecordEventMap> {};
export class RouteRecord {
    id: string;
    readonly content?: $Node;
    events = new $EventManager<RouteRecordEventMap>().register('open', 'load')
    constructor(id: string) {
        this.id = id;
    }
}
$Util.mixin(RouteRecord, $EventMethod)
export interface RouteRecordEventMap {
    'open': [{path: string, record: RouteRecord}];
    'load': [{path: string, record: RouteRecord}];
}

export interface RouteRequest<Path extends PathResolverFn | string> {
    params: PathParamResolver<Path>,
    record: RouteRecord,
    loaded: () => void;
}

export type RouteContent = $Node | string | void;