# @elexis/router
一个基于 ElexisJS 的布局网页路由工具。

## 初步认识 $Router 以及 $Route
这个工具基于两个基本的概念模块来构建：解析模块以及蓝图模块。我们先来看看如何利用此工具实现一个简单的网页路径布局：
```ts
import 'elexis';
import '@elexis/router';

$(document.body).content([
    // Router base on '/' path
    $('router').base('/').map([
        // Root page
        $('route').path('/').builder(() => [
            $('h1').content('Hello, World!'),
            $('a').content('Home').href('/home')
        ]),

        // Home page
        $('route').path('/home').builder(() => [
            $('h1').content('Hello, Home!'),
        ])
    ])
])
```
### 关于 $Router
这是一个用以解析路径并将正确内容显示在页面中的工具，由多个 `$Router` 组件构建的网页可以实现复杂的路径导航。

在上面的例子中，我们直接在 `document.body` 组件中置入一个 `$Router` 组件，并将它的基本路径设置为 `/`。这意味着我们将所有开头为 `/` 的路径都交给这个 `$Router` 进行解析。

最后，我们使用 `map()` 函数来规划不同子路径所指向的页面蓝图，也就是 `$Route` 组件。

### 关于 $Route
在传入 `$Router.map()` 方法的参数当中，`$Route` 组件并不会被使用在真实的 DOM 当中。它更像是一个蓝图的概念，你可以为这个组件添加多个属性，并使用 `builder()` 函数来规划这个页面会出现的内容。

在 Router 解析地址后，它会创建一个指向该地址的 `$Route` 组件，并将蓝图上的属性复制到新组件上，以及构建传入 `builder()` 函数的页面内容。

## 如何实现单页应用路由（Single Page App Routing）
只要使用了 `$Router` 进行路径规划，你的网页就已经具备了单页应用路由的功能。使用 `$.open('PATH')` 就能在不跳转页面的情况下打开目标页面了。
```ts
$('button').content('Open Home Page').on('click', () => $.open('/home'))
```
在浏览器的预设中，`<a>` 组件的链接是会以跳转页面的形式打开链接的。你可以单独对每一个 `<a>` 设置触发事件来避免跳转，或者你可以直接使用一行代码将所有 `<a>` 组件的链接都预设为路由器控制：
```ts
// 将这一行代码写在程序的入口文件中
$.anchorHandler = ($a) => $.open($a.href());
```

## 路径参数
在规划路径时，你可以在路径中的某一段设置变量，并且可以直接在构建内容时获取该变量对应在路径中的值：
```ts
$(document.body).content([
    $('router').base('/').map([
        // Root page
        $('route').path('/').builder(() => [
            $('h1').content('Hello, World!'),
            $('a').content('Elexis').href('/Elexis/greating')
        ]),

        // Greating page
        $('route').path('/:name/greating').builder(({params}) => [
            $('h1').content(`Hello, ${params.name}!`),
        ])
    ])
])
```

## 路由嵌套
多个路由器组成的路由嵌套可实现更复杂且精确的网页内容展示，这些路由组件可根据网址变化并在遵循路径规划的规则下改变显示内容。以下代码能够展示路由嵌套所带来的可拓展性：
```ts
$(document.body).content([
    $('router').base('/').map([
        $('route').path('/').builder(() => [
            $('h1').content('Welcome!'),
            // navigation
            $('ul').content([
                $('li').content($('a').content('Intro').href('/')),
                $('li').content($('a').content('About Me').href('/about')),
                $('li').content($('a').content('Contact').href('/contact'))
            ]),
            // nested router
            $('router').base('/').map([
                $('route').path('/').builder(() => $('h2').content('Intro')),
                $('route').path('/about').builder(() => $('h2').content('About')),
                $('route').path('/contact').builder(() => [
                    $('h2').content('Contact'),
                    // navigation
                    $('ul').content([
                        $('li').content($('a').content('Email').href('#email')),
                        $('li').content($('a').content('Phone').href('#phone')),
                    ]),
                    // nested router
                    $('router').base('/contact').map([
                        $('route').path(['/', '#email']).builder(() => $('p').content('elexis@example.com')),
                        $('route').path('#phone').builder(() => $('p').content('012-456789')),
                    ])
                ])
            ])
        ]),
    ])
])
```

## 多路径指向单一页面
将类型 `string[]` 导入 `path()` 函数中，能够实现多个路径指向同一个页面的结果。
```ts
$('route').path(['/', '/intro']).builder(() => $('h1').content('Intro'));
```