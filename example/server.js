// server.js
const { template } = require('./templates/website')
const express = require('express')

const app = express()

// route
app
    .get('/', (req, res) => {
        template(res);
    })
    .listen('4000', () => console.log('Server started on port 4000'))