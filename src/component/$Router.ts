import { $AnchorTarget, $EventManager } from "elexis";
import { $Route, $RoutePathHandler, $RoutePathType } from "./$Route";
import { $View, $ViewEventMap, $ViewOptions } from "@elexis.js/view";
import { $Page } from "./$Page";

export interface $RouterOptions extends $ViewOptions {}
export class $Router<EM extends $ViewEventMap<$Page> = $ViewEventMap<$Page>> extends $View<$Page, EM> {
    #base: string = '';
    routes = new Map<$RoutePathType | $RoutePathHandler, $Route>();
    static routers = new Map<string, $Router>();
    static events = new $EventManager<$RouterEventMap>();
    static navigationDirection: $RouterNavigationDirection;
    static index = 0;
    static forwardIndex = 0;
    static url = new URL(location.href);
    private static scrollHistoryKey = `$ROUTER_SCROLL_HISTORY`;
    constructor(options?: $RouterOptions) {
        super({tagname: 'router', ...options});
    }

    base(): string;
    base(pathname: string): this;
    base(pathname?: string) { return $.fluent(this, arguments, () => this.#base, () => { 
        this.#base = pathname ?? this.#base 
        if (pathname) $Router.routers.set(this.#base, this);
    }) }

    map(routes: OrMatrix<$Route<$RoutePathType, any, any>>) {
        routes = $.orArrayResolve(routes);
        for (const route of routes) {
            if (route instanceof Array) this.map(route);
            else {
                this.routes.set(route.path(), route as any);
            }
        }
        this.resolve();
        return this;
    }

    protected resolve(): Promise<$RouterResolveResult> {
        return new Promise(resolve => {
            if (!location.pathname.startsWith(this.#base)) return resolve($RouterResolveResult.NotMatchBase);
            const locationPath = location.pathname.replace(this.#base, '/').replace('//', '/') // /a/b
            const locationPathParts = locationPath === '/' ? ['/'] : ['/', ...locationPath.replace(/^\//, '').split('/').map(path => `${path}`)];
            if (location.hash) locationPathParts.push(location.hash)
            const locationQuery = location.search;
            const locationQueryMap = new Map(locationQuery.replace('?', '').split('&').map(query => query.split('=') as [string, string | undefined]));
            interface RouteData {$route: $Route, routePath: string | $RoutePathHandler, params: {[key: string]: string}, query: {[key: string]: string | undefined}, pathId: string, fullMatch: boolean}
            const find = (): RouteData => {
                const matchedRoutes: (RouteData & {deep: number})[] = []
                for (const [routePathResolve, $route] of this.routes) {
                    const routePathList = $.orArrayResolve(routePathResolve);
                    for (const routePath of routePathList) {
                        let deep = 0, params = {}, query = {};
                        if (routePath instanceof Function) {
                            // path handler
                            const data = routePath(locationPath);
                            if (!data) continue;
                            return {$route, params: data.params ?? {}, routePath, pathId: data.pathId, query: data.query ?? {}, fullMatch: true}
                        } else {
                            const routeParts = routePath === '/' ? ['/'] : ['/', ...routePath.replace(/^\//, '').split('/').map(path => `${path}`)];
                            if (locationPathParts.length < routeParts.length) continue;
                            for (let i = 0; i < routeParts.length; i ++) {
                                const [routePathPart, routeQueries] = routeParts[i].split('?');
                                // search query
                                if (routeQueries) { routeQueries.split('&').forEach(routeQuery => {
                                    const locationQueryValue = locationQueryMap.get(routeQuery);
                                    if (locationQueryValue !== undefined) deep++;
                                    Object.assign(query, {[routeQuery]: locationQueryValue})
                                })}
                                // search params
                                if (routePathPart.startsWith(':')) { deep++; Object.assign(params, {[routePathPart.replace(':', '')]: locationPathParts[i]}); continue; }
                                // match hash part
                                else if (routePath.startsWith('#') && routePath === location.hash) { deep++; continue; }
                                // match path
                                else if (routePathPart === locationPathParts[i]) { deep++; continue; }
                                else { break; }
                            }
                            matchedRoutes.push({
                                deep, $route, params, query, routePath, 
                                fullMatch: routeParts.length === locationPathParts.length,
                                // route path with params will set the locationPath as pathId, with query will set locationPath + locationQuery as pathId
                                pathId: !$route.static() ? routePathList[0] as string : Object.keys(query).length !== 0 ? locationPath + locationQuery : Object.keys(params).length !== 0 ? locationPath : routePathList[0] as string
                            })
                        }
                    }
                }
                return matchedRoutes.sort((a, b) => b.deep - a.deep).at(0)!;
            }
    
            const $routeData = find();
            if (!$routeData) return resolve($RouterResolveResult.NotFound);
            const {$route, params, pathId, query} = $routeData;
            if ($route.static() && pathId === this.contentId) return resolve($RouterResolveResult.OK); // current route
            this.events.once('rendered', ({nextContent, previousContent}) => {
                previousContent?.events.fire('afterShift', previousContent);
                nextContent.events.fire('rendered', nextContent);
                resolve($RouterResolveResult.OK);
            });
            const $page = this.viewCache.get(pathId) ?? $route.build({params, query, pathId: pathId, base: this.base()});
            if ($page instanceof Promise) $page.then(handlePage.bind(this));
            else handlePage.bind(this)($page)
            
            function handlePage(this: $Router, $page: $Page) {
                // result
                if ($routeData.fullMatch) resolve($RouterResolveResult.OK);
                else if ($page.children.iterate($node => $node instanceof $Router)) resolve($RouterResolveResult.OK);
                else return resolve($RouterResolveResult.NotFound);
                $page.params = params;
                $page.query = query;
                if (!this.viewCache.has(pathId)) { this.setView(pathId, $page); }
                this.events.once('beforeSwitch', () => {
                    $page.events.fire('beforeShift', $page);
                    this.currentContent?.events.fire('beforeShift', this.currentContent);
                })
                this.events.once('afterSwitch', () => $page.events.fire('afterShift', $page));
                if (this.currentContent !== $page) this.currentContent?.events.fire('close', this.currentContent);
                // handle current page child router events
                this.currentContent?.children.iterate($node => $node instanceof $Page ? $node.events.fire('close', $node) && false : false)
                $page?.children.iterate($node => $node instanceof $Page ? $node.events.fire('open', $node) && false : false)
                $page.events.fire('open', $page);
                this.switchView(pathId);
            }
        })
    }

    static init() {
        if (!history.state || 'index' in history.state === false) {
            const state: $RouterState = { index: $Router.index }
            history.replaceState(state, '')
        } else {
            $Router.index = history.state.index
        }
        $Router.navigationDirection = $RouterNavigationDirection.Forward;
        $Router.resolve();
        window.addEventListener('popstate', () => $Router.popstate());
        window.addEventListener('scroll', () => { this.setScrollHistory(this.index, location.href, document.documentElement.scrollTop) }, {passive: true})
        history.scrollRestoration = 'manual';
        return this;
    }

    static open(url: string | URL | undefined, target?: $AnchorTarget) {
        if (url === undefined) return this;
        url = this.urlResolver(url);
        if (url.href === this.url.href) return this;
        if (url.origin !== this.url.origin) {
            window.open(url, target);
            return this;
        }
        $Router.clearForwardScrollHistory();
        $Router.forwardIndex = 0;
        $Router.index++;
        history.pushState($Router.historyState, '', url);
        $Router.stateChange($RouterNavigationDirection.Forward);
        $Router.resolve();
        return this;
    }

    static back() {
        history.back()
        return this;
    }

    static forward() {
        if (this.forwardIndex === 0) return this;
        history.forward()
        return this;
    }

    static replace(url: string | URL | undefined) {
        if (url === undefined) return this;
        url = this.urlResolver(url);
        history.replaceState($Router.historyState, '', url);
        this.stateChange($RouterNavigationDirection.Replace);
        this.setScrollHistory(this.index, location.href, 0);
        $Router.resolve();
        return this;
    }

    protected static urlResolver(url: URL | string) {
        if (url instanceof URL) return url;
        if (url.startsWith('/')) { url = `${location.origin}${url}`; }
        else if (url.startsWith('#')) { url = `${location.origin}${location.pathname}${location.search}${url}`}
        else if (url.startsWith('?')) { url = `${location.origin}${location.pathname}${url}${location.hash}`}
        return new URL(url)
    }

    protected static popstate() {
        const direction: $RouterNavigationDirection 
            = history.state.index > $Router.index 
                ? $RouterNavigationDirection.Forward
                : history.state.index < $Router.index
                ? $RouterNavigationDirection.Back
                : $RouterNavigationDirection.Replace
        if (direction === $RouterNavigationDirection.Forward) this.forwardIndex--;
        else if (direction === $RouterNavigationDirection.Back) this.forwardIndex++
        $Router.index = history.state.index;
        $Router.stateChange(direction);
        $Router.resolve();
    }

    protected static async resolve() {
        const result = await Promise.all([...$Router.routers.values()].map($router => $router.resolve()));
        this.scrollRestoration();
        this.setScrollHistory(this.index, location.href, document.documentElement.scrollTop);
    }

    protected static get historyState() { return { index: $Router.index, } }

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

    protected static clearForwardScrollHistory() {
        const record = this.getScrollHistory();
        if (record) for (const i in record) {
            if (Number(i) > this.index) delete record[i];
            sessionStorage.setItem(this.scrollHistoryKey, JSON.stringify(record));
        }
    }

    protected static scrollRestoration() {
        const record = this.getScrollHistory();
        if (record && record[this.index]) document.documentElement.scrollTop = record[this.index].value ?? 0;
        else if (location.hash.length) {
            const $target = $(document.body).$(`:${location.hash}`);
            if ($target) document.documentElement.scrollTop = $target.dom.offsetTop;
        } else {
            document.documentElement.scrollTop = 0;
        }
    }
}

enum $RouterResolveResult { OK = 200, NotFound = 404, NotMatchBase = 400 }
export enum $RouterNavigationDirection { Forward, Back, Replace }
interface $RouterState { index: number }
export interface $RouterEventMap extends $ViewEventMap<$Page> {
    'stateChange': [{beforeURL: URL, afterURL: URL, direction: $RouterNavigationDirection}]
}
interface $RouterScrollHistoryData {[index: number]: {url: string, value: number}}

$Router.init();