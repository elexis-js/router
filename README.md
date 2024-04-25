# @elexis/router
Single page app router extension for [ElexisJS](https://github.com/defaultkavy/elexis)

## Installation
```
npm i @elexis/router
```

## Usage
```ts
import 'elexis';
import '@elexis/router';
import { Router, Route } from '@elexis/router'

// create new Router with base path '/', 
const router = new Router('/');

// append router view element
const $app = $('app').content([
    router.$view
])

const home_page_route = new Route('/', () => {
    // which this callback function return will be appended
    // into router view element when path match
    return $('h1').content('This is a Homepage!')
})

// Add home_page_route into router
router.addRoute(home_page_route);
// Router starting listen location path change
router.listen();
```
> Without `Router.listen()`, Router will do nothing when page loaded.

## Global $ Methods
```ts
import 'elexis';
import '@elexis/router';

$.open('/about') // open /about page without load page
$.back() // back
$.replace('/hello') // replace current page history state with url
```

## Events

### Router event: load
```ts
const gallery_route = new Route('/gallery', ({loaded}) => {

    async function $ImageList() {
        // fetch images and return elements

        // after all image loaded, using loaded function.
        // this will trigger load event on anccestor router
        loaded();
    }
    return $('div').content([
        $ImageList()
    ])
})

router.on('load', () => {...})
```

### RouteRecord event: open
```ts
const viewer_route = new Route('/viewer', ({record}) => {
    const page_open_count$ = $.state(0);

    // this event will be fire everytime this page opened
    record.on('open', () => {
        page_open_count$.set( page_open_count$.value + 1 );
    })

    return $('div').content(page_open_count$) 
})
```

### Router event: notfound
```ts
// Route will remove all child of view when path is not exist.
// Using preventDefault function to prevent this action.
router.on('notfound', ({preventDefault}) => {
    preventDefault(); // prevent remove all child of view
    ... // do something
})
```

### `static` Router event: pathchange
```ts
// This event fired on location change happened
Router.on('pathchange', () => {
    ... // do something
})
```