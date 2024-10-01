import 'elexis';
import { $Router } from './lib/$Router';
import { $Route } from './lib/$Route';
declare module 'elexis' {
    export namespace $ {
        export interface TagNameElementMap {
            'router': typeof $Router;
            'route': typeof $Route;
        } 
        export function open(path: string | URL | undefined): typeof $Router;
        export function replace(path: string | URL | undefined): typeof $Router;
        export function back(): typeof $Router;
    }
}
$.registerTagName('router', $Router);
$.registerTagName('route', $Route);

Object.assign($, {
    open(path: string | URL | undefined) { return $Router.open(path) },
    replace(path: string | URL | undefined) { return $Router.replace(path) },
    back() { return $Router.back() }
})

export * from './lib/$Route';
export * from './lib/$Router';
