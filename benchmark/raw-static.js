const express = require('express')
const { createElement: h } = require('react')
const { renderToString } = require('react-dom/server')
const path = require('path')
const { readFileSync } = require('fs')

const App = require('./App')

const app = express()

const template = `
  <!doctype html>
  <html>
    <head>
      <style>
        ${readFileSync(path.resolve(__dirname, 'style.css'))}
      </style>
    </head>
    <body>
      ${renderToString(h(App, null))}
    </body>
  </html>
`

app
  .get('/', (req, res) => res.end(template))
  .listen(1337, () => console.log('Server listening on port 1337'))


