const jsonServer = require('json-server')
const express = require('express');
const path = require('path');

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use('/public', express.static(path.join(__dirname, 'public')))
// Add this before server.use(router)
server.use(jsonServer.rewriter({
    '/api/*': '/$1',
    '/blog/:resource/:id/show': '/:resource/:id'
}))

// Serve homepage with links to all APIs
server.get('/', (req, res) => {
    const resources = Object.keys(router.db.__wrapped__)
    const links = resources.map(resource => `<li><a href="/${resource}">${resource}</a></li>`)
    res.send(`<h1>APIs:</h1><ul>${links.join('')}</ul>`)
})

server.use(router)
server.listen(process.env.PORT || 3000, () => {
    console.log('JSON Server is running')
})

// Export the Server API
module.exports = server
