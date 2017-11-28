# Marinate

WORK IN PROGRESS

<p align="center">
    <img src="logo.jpg" alt="Marinate logo" height="300" />
</p>

A JavaScript library making use of [Tagged Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) to chunk, transform and pipe a template to a given stream.

## Installation

The library works on Node 8 and above. However, it's possible to transpile the used features (async await in for..of, template literal strings, tagged template literal) to support older versions of Node.

```bash
# use npm
npm install marinate
# or yarn
yarn add marinate
# or new-hip-package-manager-for-js
new-hip-package-manager-for-js marinate
```

## Usage

For a working server, check out [this](/example) example that uses [react](https://reactjs.org) & [express](https://expressjs.com/).

```js
import marinate from 'marinate';

import express from 'express';
import fetch from 'node-fetch';

import { renderToString, renderToNodeStream }  from 'hip-new-framework-of-the-month';

import { Nav, App } from './spa';
import footerHTML from './templates/footer';

const app = express();

const template = marinate`
<!doctype html>
<html>
  <body>
    ${renderToString(Nav)}
    ${() => renderToNodeStream(App)}
    ${() => fetch('api-route').then(r => r.text())}
    ${() => footerHTML}
  </body>
</html>`

app
  .get('/', (req, res) => template(res))
  .listen(4000, () => 'Server listening on port 4000')
```

## Motivation

`marinate` was created to solve a problem where a node based web server is designed to stream the output, yet use a templating library to split static and non-static parts.

Assume following template

```js
const template = `<html>
  <head>
    ${fs.readFileSync(cssPath)}
  </head>
  <body>
    ${renderToString(App)}
  </body>
</html>`
```

If you want to stream `fs.readFileSync` or `renderToString` part of your application, you will have to split your template into chunks, i.e. template parts before and the said part, then write your first chunk to HTTP Response stream, pipe your `App` renderStream to it, and finally write latter chunk once your `App` stream ends. This gets complicated as more and more dynamic portions become part of your template.


## Tagged Template Literals 

Thankfully, ES2015's tagged template literals are sort of designed to do exactly this. They can create these chunks automatically, and act differently upon the dynamic parts. This allows you to now pass functions, promises, streams and what not !

Currently we support following parts:

* [x] strings
* [x] functions
  * [x] returning strings
  * [x] returning promises
  * [x] returning streams

**Note that a function can return a function, or a promsie can resovle to a function/promise. Basically the definition of dynami parts is recursive, ultimately evaluating to a string or stream. Be careful!**

## License 
MIT