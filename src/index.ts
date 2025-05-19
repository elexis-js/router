import 'elexis/core';
import { $Router } from '#component/$Router';
import { $Route } from '#component/$Route';
import { $RouterAnchor } from '#component/$RouterAnchor';
import type { $AnchorTarget } from 'elexis/node/$Anchor';
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

export * from '#component/$Route';
export * from '#component/$Router';
export * from '#component/$Page';
export * from '#component/$RouterAnchor';