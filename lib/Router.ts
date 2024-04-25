import { $EventMethod, $View, $EventManager, $Text } from "elexis";
import { $Util } from "elexis/lib/$Util";
import { PathResolverFn, Route, RouteRecord } from "./Route";
export interface Router extends $EventMethod<RouterEventMap> {};
export class Router {
    routeMap = new Map<string | PathResolverFn, Route<any>>();
    recordMap = new Map<string, RouteRecord>();
    $view: $View;
    static index: number = 0;
    static events = new $EventManager<RouterGlobalEventMap>().register('pathchange', 'notfound', 'load');
    events = new $EventManager<RouterEventMap>().register('notfound', 'load');
    basePath: string;
    static currentPath: URL = new URL(location.href);
    constructor(basePath: string, view?: $View) {
        this.basePath = basePath;
        this.$view = view ?? new $View();
    }

    /**Add route to Router. @example Router.addRoute(new Route('/', 'Hello World')) */
    addRoute(routes: OrArray<Route<any>>) {
        routes = $.orArrayResolve(routes);
        for (const route of routes) this.routeMap.set(route.path, route);
        return this;
    }

    /**Start listen to the path change */
    listen() {
        if (!history.state || 'index' in history.state === false) {
            const routeData: RouteData = {index: Router.index, data: {}}
            history.replaceState(routeData, '')
        } else {
            Router.index = history.state.index
        }
        addEventListener('popstate', this.popstate)
        $.routers.add(this);
        this.resolvePath();
        Router.events.fire('pathchange', {prevURL: undefined, nextURL: Router.currentPath, navigation: 'Forward'});
        return this;
    }

    /**Open URL */
    static open(url: string | URL | undefined) {
        if (url === undefined) return this;
        url = new URL(url);
        if (url.origin !== location.origin) return this;
        if (url.href === location.href) return this;
        const prevPath = Router.currentPath;
        this.index += 1;
        const routeData: RouteData = { index: this.index, data: {} };
        history.pushState(routeData, '', url);
        Router.currentPath = new URL(location.href);
        $.routers.forEach(router => router.resolvePath())
        Router.events.fire('pathchange', {prevURL: prevPath, nextURL: Router.currentPath, navigation: 'Forward'});
        return this;
    }

    /**Back to previous page */
    static back() { 
        const prevPath = Router.currentPath;
        history.back(); 
        Router.currentPath = new URL(location.href);
        Router.events.fire('pathchange', {prevURL: prevPath, nextURL: Router.currentPath, navigation: 'Back'});
        return this 
    }

    static replace(url: string | URL | undefined) {
        if (url === undefined) return this;
        if (typeof url === 'string' && !url.startsWith(location.origin)) url = location.origin + url;
        url = new URL(url);
        if (url.origin !== location.origin) return this;
        if (url.href === location.href) return this;
        const prevPath = Router.currentPath;
        history.replaceState({index: Router.index}, '', url)
        Router.currentPath = new URL(location.href);
        $.routers.forEach(router => router.resolvePath(url.pathname));
        Router.events.fire('pathchange', {prevURL: prevPath, nextURL: Router.currentPath, navigation: 'Forward'});
        return this;
    }

    setStateData(key: string, value: any) {
        if (history.state.data === undefined) history.state.data = {};
        history.state.data[key] = value;
        return this;
    }

    private popstate = (() => {
        // Forward
        if (history.state.index > Router.index) { }
        // Back
        else if (history.state.index < Router.index) {  }
        const prevPath = Router.currentPath;
        Router.index = history.state.index;
        this.resolvePath();
        Router.currentPath = new URL(location.href);
        Router.events.fire('pathchange', {prevURL: prevPath, nextURL: Router.currentPath, navigation: 'Forward'});
    }).bind(this)

    private resolvePath(path = location.pathname) {
        if (!path.startsWith(this.basePath)) return;
        path = path.replace(this.basePath, '/').replace('//', '/');
        let found = false;
        const openCached = (pathId: string) => {
            const record = this.recordMap.get(pathId);
            if (record) {
                found = true;
                if (record.content && !this.$view.contains(record.content)) this.$view.switchView(pathId);
                record.events.fire('open', {path, record});
                return true;
            }
            return false;
        }
        const create = (pathId: string, route: Route<any>, data: any) => {
            const record = new RouteRecord(pathId);
            let content = route.builder({
                params: data, 
                record: record, 
                loaded: () => {
                    record.events.fire('load', {path: pathId, record});
                    this.events.fire('load', {path: pathId});
                }
            });
            if (typeof content === 'string') content = new $Text(content);
            if (content === undefined) return;
            (record as Mutable<RouteRecord>).content = content;
            this.recordMap.set(pathId, record);
            this.$view.setView(pathId, content).switchView(pathId);
            record.events.fire('open', {path, record});
            found = true;
        }
        for (const [pathResolver, route] of this.routeMap.entries()) {
            // PathResolverFn
            if (pathResolver instanceof Function) {
                const routeId = pathResolver(path)
                if (routeId) { if (!openCached(routeId)) create(routeId, route, undefined) }
                continue;
            }
            // string
            const [_routeParts, _pathParts] = [pathResolver.split('/').map(p => `/${p}`), path.split('/').map(p => `/${p}`)];
            _routeParts.shift(); _pathParts.shift();
            const data = {};
            let pathString = '';
            for (let i = 0; i < _pathParts.length; i++) {
                const [routePart, pathPart] = [_routeParts.at(i), _pathParts.at(i)];
                if (!routePart || !pathPart) continue;
                if (routePart === pathPart) {
                    pathString += pathPart;
                    if (routePart === _routeParts.at(-1)) {
                        if (!openCached(pathString)) create(pathString, route, data);
                        return;
                    }
                }
                else if (routePart.includes(':')) {
                    const [prefix, param] = routePart.split(':');
                    if (!pathPart.startsWith(prefix)) continue;
                    Object.assign(data, {[param]: pathPart.replace(prefix, '')})
                    pathString += pathPart;
                    if (routePart === _routeParts.at(-1)) {
                        if (!openCached(pathString)) create(pathString, route, data);
                        return;
                    }
                }
            }
        }

        if (!found) {
            let preventDefaultState = false;
            const preventDefault = () => preventDefaultState = true;
            this.events.fire('notfound', {path, preventDefault});
            if (!preventDefaultState) this.$view.clear();
        }
    }

    static on<K extends keyof RouterGlobalEventMap>(type: K, callback: (...args: RouterGlobalEventMap[K]) => any) { this.events.on(type, callback); return this }
    static off<K extends keyof RouterGlobalEventMap>(type: K, callback: (...args: RouterGlobalEventMap[K]) => any) { this.events.off(type, callback); return this }
    static once<K extends keyof RouterGlobalEventMap>(type: K, callback: (...args: RouterGlobalEventMap[K]) => any) { this.events.once(type, callback); return this }
}
$Util.mixin(Router, $EventMethod);
interface RouterEventMap {
    notfound: [{path: string, preventDefault: () => any}];
    load: [{path: string}];
}

interface RouterGlobalEventMap {
    pathchange: [{prevURL?: URL, nextURL: URL, navigation: 'Back' | 'Forward'}];
}

type RouteData = {
    index: number;
    data: {[key: string]: any};
}