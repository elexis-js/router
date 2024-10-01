import 'elexis';
import { Router } from './lib/Router';
declare module 'elexis' {
    export namespace $ {
        export const routers: Set<Router>;
        export function open(path: string | URL | undefined): typeof Router;
        export function replace(path: string | URL | undefined): typeof Router;
        export function back(): typeof Router;
    }
}

Object.assign($, {
    routers: Router.routers,
    open(path: string | URL | undefined) { return Router.open(path) },
    replace(path: string | URL | undefined) { return Router.replace(path) },
    back() { return Router.back() }
})

addEventListener('popstate', Router.popstate); // Start listening

export * from './lib/Route';
export * from './lib/Router';