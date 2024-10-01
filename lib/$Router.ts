import { $EventManager } from "elexis";
import { $Route, $RoutePathType } from "./$Route";
import { $View, $ViewOptions } from "@elexis/view";

export interface $RouterOptions extends $ViewOptions {}
export class $Router extends $View {
    #base: string = '';
    routes = new Map<$RoutePathType, $Route>();
    static routers = new Set<$Router>();
    static events = new $EventManager<$RouterEventMap>().register('stateChange')
    static navigationDirection: $RouterNavigationDirection
    static historyIndex = 0;
    static url = new URL(location.href);
    private static scrollHistoryKey = `$ROUTER_SCROLL_HISTORY`;
    constructor(options?: $RouterOptions) {
        super({tagname: 'router', ...options});
        $Router.routers.add(this);
    }

    base(): string;
    base(pathname: string): this;
    base(pathname?: string) { return $.fluent(this, arguments, () => this.#base, () => { this.#base = pathname ?? this.#base }) }

    map(routes: OrMatrix<$Route<any>>) {
        routes = $.orArrayResolve(routes);
        for (const route of routes) {
            if (route instanceof Array) this.map(route);
            else {
                this.routes.set(route.path(), route);
            }
        }
        this.resolve();
        return this;
    }

    protected resolve(): Promise<$RouterResolveResult> {
        return new Promise(resolve => {
            if (!location.pathname.startsWith(this.#base)) return resolve($RouterResolveResult.NotMatchBase);
            const locationPath = location.pathname.replace(this.#base, '/').replace('//', '/') // /a/b
            const locationParts = locationPath.split('/').map(path => `/${path}`);
            const find = () => {
                const matchedRoutes: {deep: number, $route: $Route, params: {[key: string]: string}, pathId: string}[] = []
                for (const [routePathResolve, $route] of this.routes) {
                    const routePathList = $.orArrayResolve(routePathResolve);
                    for (const routePath of routePathList) {
                        let deep = 0, params = {};
                        if (routePath.startsWith('#')) {
                            // multiple route path will set the first path as pathId
                            if (routePath === location.hash) return {deep, $route, params, pathId: routePathList[0]};
                            else continue;
                        }
                        const routeParts = routePath.split('/').map(path => `/${path}`)
                        if (locationParts.length < routeParts.length) continue;
                        for (let i = 0; i < routeParts.length; i ++) {
                            if (routeParts[i].startsWith('/:')) { deep++; Object.assign(params, {[routeParts[i].replace('/:', '')]: locationParts[i].replace('/', '')}); continue; }
                            else if (routeParts[i] === locationParts[i]) { deep++; continue; }
                            else { break; }
                        }
                        // route path with params will set the locationPath as pathId
                        matchedRoutes.push({deep, $route, params, pathId: Object.keys(params).length === 0 ? routePathList[0] : locationPath})
                    }
                }
                return matchedRoutes.sort((a, b) => b.deep - a.deep).at(0);
            }
    
            const $routeData = find();
            if (!$routeData) return resolve($RouterResolveResult.NotFound);
            const {$route, params, pathId} = $routeData;
            if (pathId === this.contentId) return resolve($RouterResolveResult.OK); // current route
            this.events.once('rendered', ({nextContent, previousContent}) => {
                if (previousContent instanceof $Route) previousContent.events.fire('closed');
                if (nextContent instanceof $Route) nextContent.events.fire('opened');
                resolve($RouterResolveResult.OK);
            });
            if (!this.viewCache.get(pathId)) {
                const $buildedRoute = $route.build({params});
                this.setView(pathId, $buildedRoute);
            }
            this.switchView(pathId);
        })
    }

    static init() {
        if (!history.state || 'index' in history.state === false) {
            const state: $RouterState = { index: $Router.historyIndex }
            history.replaceState(state, '')
        } else {
            $Router.historyIndex = history.state.index
        }
        $Router.navigationDirection = $RouterNavigationDirection.Forward;
        $Router.resolve();
        window.addEventListener('popstate', () => $Router.popstate());
        window.addEventListener('scroll', () => { this.setScrollHistory(this.historyIndex, location.href, document.documentElement.scrollTop) })
        history.scrollRestoration = 'manual';
        return this;
    }

    static open(url: string | URL | undefined) {
        if (url === undefined) return this;
        url = new URL(url);
        if (url.href === this.url.href) return this;
        this.historyIndex++;
        history.pushState($Router.historyState, '', url);
        this.stateChange($RouterNavigationDirection.Forward);
        $Router.resolve();
        return this;
    }

    static back() {
        this.historyIndex--;
        history.back()
        this.stateChange($RouterNavigationDirection.Back);
        return this;
    }

    static replace(url: string | URL | undefined) {
        if (url === undefined) return this;
        if (typeof url === 'string' && !url.startsWith(location.origin)) url = location.origin + url;
        history.replaceState($Router.historyState, '', url);
        this.stateChange($RouterNavigationDirection.Replace);
        $Router.resolve();
        return this;
    }

    protected static popstate() {
        const direction: $RouterNavigationDirection 
            = history.state.index > $Router.historyIndex 
                ? $RouterNavigationDirection.Forward
                : history.state.index < $Router.historyIndex
                ? $RouterNavigationDirection.Back
                : $RouterNavigationDirection.Replace
        
        $Router.historyIndex = history.state.index;
        $Router.stateChange(direction);
        $Router.resolve();
    }

    protected static async resolve() {
        await Promise.all([...$Router.routers.values()].map($router => $router.resolve()));
        this.scrollRestoration();
    }

    protected static get historyState() { return { index: $Router.historyIndex, } }

    protected static stateChange(direction: $RouterNavigationDirection) {
        const beforeURL = this.url;
        const afterURL = new URL(location.href);
        this.url = afterURL;
        $Router.events.fire('stateChange', {beforeURL, afterURL, direction})
        $Router.navigationDirection = direction;
    }

    protected static setScrollHistory(index: number, url: string, value: number) {
        const record = this.getScrollHistory()
        if (!record) return sessionStorage.setItem(this.scrollHistoryKey, JSON.stringify({[index]: {url, value}}));
        record[index] = {url, value};
        sessionStorage.setItem(this.scrollHistoryKey, JSON.stringify(record));
    }

    protected static getScrollHistory() {
        const data = sessionStorage.getItem(this.scrollHistoryKey);
        if (!data) return undefined;
        else return JSON.parse(data) as $RouterScrollHistoryData;
    }

    protected static scrollRestoration() {
        const record = this.getScrollHistory();
        if (!record) return;
        document.documentElement.scrollTop = record[this.historyIndex]?.value ?? 0;
    }
}

enum $RouterResolveResult { OK, NotFound, NotMatchBase }
export enum $RouterNavigationDirection { Forward, Back, Replace }
interface $RouterState { index: number }
export interface $RouterEventMap {
    'stateChange': [{beforeURL: URL, afterURL: URL, direction: $RouterNavigationDirection}]
}
interface $RouterScrollHistoryData {[index: number]: {url: string, value: number}}

$Router.init();