const { csrfSync } = require('csrf-sync')

const { csrfSynchronisedProtection, generateToken } = csrfSync({
    getTokenFromRequest: (req) => req.body['_csrf']
})


module.exports =  { csrfSynchronisedProtection, generateToken}