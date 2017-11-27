const express = require('express')
const { createElement: h } = require('react')
const marinate = require('marinate')
const { renderToNodeStream } = require('react-dom/server')
const path = require('path')
const { createReadStream } = require('fs')

const App = require('./App')

const app = express()

const template = marinate`
  <!doctype html>
  <html>
    <head>
      <style>
        ${() => createReadStream(path.resolve(__dirname, 'style.css'))}
      </style>
    </head>
    <body>
      ${() => renderToNodeStream(h(App, null))}
    </body>
  </html>
`

app
  .get('/', (req, res) => template(res))
  .listen(1337, () => console.log('Server listening on port 1337'))


