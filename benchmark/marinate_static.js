const express = require('express')
const { createElement: h } = require('react')
const marinate = require('marinate')
const { renderToString } = require('react-dom/server')
const path = require('path')
const { readFileSync } = require('fs')

const App = require('./App')

const app = express()

const template = marinate`
  <!doctype html>
  <html>
    <head>
      <style>
        ${readFileSync(path.resolve(__dirname, 'style.css'), 'utf-8')}
      </style>
    </head>
    <body>
      ${renderToString(h(App, null))}
    </body>
  </html>
`

app
  .get('/', (req, res) => template(res))
  .listen(1337, () => console.log('Server listening on port 1337'))


