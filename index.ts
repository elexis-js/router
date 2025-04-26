import 'elexis/core';
import { $Router } from './src/component/$Router';
import { $Route } from './src/component/$Route';
import { $RouterAnchor } from './src/component/$RouterAnchor';
import type { $AnchorTarget } from 'elexis/src/node/$Anchor';
declare module 'elexis/core' {
    export namespace $ {
        export interface TagNameElementMap {
            'router': typeof $Router;
            'route': typeof $Route;
            'ra': typeof $RouterAnchor;
        } 
        export function open(path: string | URL | undefined, target?: $AnchorTarget): typeof $Router;
        export function replace(path: string | URL | undefined): typeof $Router;
        export function back(): typeof $Router;
        export function forward(): typeof $Router;
    }
}
$.registerTagName('router', $Router);
$.registerTagName('route', $Route);
$.registerTagName('ra', $RouterAnchor);

Object.assign($, {
    open(path: string | URL | undefined, target?: $AnchorTarget) { return $Router.open(path, target) },
    replace(path: string | URL | undefined) { return $Router.replace(path) },
    back() { return $Router.back() },
    forward() { return $Router.forward() }
})

export * from './src/component/$Route';
export * from './src/component/$Router';
export * from './src/component/$Page';
export * from './src/component/$RouterAnchor';