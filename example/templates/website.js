const { createElement: h } = require('react')
const { renderToNodeStream, renderToString } = require('react-dom/server')
const path = require('path')
const fs = require('fs')
const marinate = require('marinate')

const meta = renderToString([
  h('meta', { key: '1', charSet: 'utf-8' }),
  h('meta', { key: '2', name: 'description', content: 'A demo rendered using marinate on a node server' }),
  h('meta', { key: '3', name: 'keywords', content: 'nodejs, reactjs, es2015, template strings' }),
  h('meta', { key: '4', name: 'author', content: 'bogas04' }),
  h('meta', { key: '5', name: 'viewport', content: 'width=device-width, initial-scale=1.0' })
])

const body$ = () => renderToNodeStream([
  h('h3', { key: '1', }, 'This is react component streamed using ',
    h('code', {}, 'renderToNodeStream')
  )
]);

const css$ = () => fs.createReadStream(path.resolve(__dirname, '../css/style.css'));

const delayedOutput = () => new Promise(r => setTimeout(r, 5000, 'Heyo, I just got resolved after 5000ms'));

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

exports.template = marinate`<!doctype html>
<html>
  <head>
      ${meta}
      <style>
        ${css$}
      </style>
  </head>
  <body>
    <h1> This is my website </h1>
    <p>${() => lorem}</p>
    <h2> Following part should be streamed </h2>
    ${body$}  
    <h4> Following part should be resolved in 5000ms </h4>
    ${delayedOutput}
  </body>
</html>`
