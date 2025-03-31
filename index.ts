import 'elexis';
import { $Router } from './lib/$Router';
import { $Route } from './lib/$Route';
import type { $AnchorTarget } from 'elexis';
import { $RouterAnchor } from './lib/$RouterAnchor';
declare module 'elexis' {
    export namespace $ {
        export interface TagNameElementMap {
            'router': typeof $Router;
            'route': typeof $Route;
            'router-a': typeof $RouterAnchor;
        } 
        export function open(path: string | URL | undefined, target?: $AnchorTarget): typeof $Router;
        export function replace(path: string | URL | undefined): typeof $Router;
        export function back(): typeof $Router;
        export function forward(): typeof $Router;
    }
}
$.registerTagName('router', $Router);
$.registerTagName('route', $Route);
$.registerTagName('router-a', $RouterAnchor);

Object.assign($, {
    open(path: string | URL | undefined, target?: $AnchorTarget) { return $Router.open(path, target) },
    replace(path: string | URL | undefined) { return $Router.replace(path) },
    back() { return $Router.back() },
    forward() { return $Router.forward() }
})

export * from './lib/$Route';
export * from './lib/$Router';
export * from './lib/$Page';
export * from './lib/$RouterAnchor';