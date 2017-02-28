if (process.env.NODE_ENV !== 'production') require('dotenv').config()

// WEBSOCKET STUFF
const server = require('http').createServer()
const WebSocketServer = require('uws').Server
const wss = new WebSocketServer({ server })
const { RpcServer } = require('./classes/RpcServer')

const rpcServer = new RpcServer(wss)

rpcServer.on('error', err => {
    console.error(err)
})

rpcServer.registerMethods({
    echo(message) {
        return Promise.resolve(`${message}`)
    },
    add(...args) {
        return new Promise((resolve, reject) => {
            if (this.auth()) {
                resolve(args.reduce((p, c) => p + c, 0))
            } else {
                reject('Not logged in')
            }
        })
    }
})

// AUTH
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const knex = require('./knex')

rpcServer.registerAuthenticationStrategy(token => {
    return new Promise((resolve, reject) => {
        knex.select('*')
            .from('session_tokens')
            .where({ token })
            .innerJoin('users', 'user_uid', 'users.uid')
            .limit(1)
            .then(r => {
                if (!Array.isArray(r) || !r.length) return reject()

                const user = Object.assign({}, r[0])
                delete user.hashed_password
                resolve(user)
            })
            .catch(reject)
    })
})

function bcryptCompare(plainText, hashed) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainText, hashed, (err, res) => {
            if (res) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function generateToken() {
    return `${uuid.v4() + uuid.v4() + uuid.v4() + uuid.v4()}`.replace(/\-/g, '')
}

rpcServer.registerMethods({
    register(username, email, password) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 12, (err, hashedPassword) => {
                if (err) return reject({ error: err })

                const newUser = {
                    uid: uuid.v4(),
                    username,
                    email,
                    hashed_password: hashedPassword,
                    roles: null,
                    created_at: new Date()
                }

                knex.insert(newUser)
                    .into('users')
                    .then(r => {
                        resolve({ username })
                    })
                    .catch(err => {
                        console.log('error', JSON.stringify(err, null, 4))
                        reject({ error: err })
                    })
            })
        })
    },
    login(username, password) {
        return new Promise((resolve, reject) => {
            let userUid
            let token
            knex.select('*')
                .from('users')
                .where({ username })
                .then(r => {
                    if (!Array.isArray(r) || !r.length) return reject()

                    const user = r[0]
                    const { uid, hashed_password } = user
                    userUid = uid
                    return bcryptCompare(password, hashed_password)
                })
                .then(() => {
                    token = generateToken()
                    const newSessionToken = {
                        uid: uuid.v4(),
                        token,
                        created_at: new Date(),
                        user_uid: userUid
                    }
                    return knex.insert(newSessionToken)
                        .into('session_tokens')
                })
                .then(r => {
                    resolve({ username, token })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
})

// GOOGLE STUFF
const google = require('googleapis')
const OAuth2 = google.auth.OAuth2
const oauth2 = new OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET, 'https://bcb2c4a9.ngrok.io/oauth2callback')
const gmailApiScopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.metadata'
]

function getGoogleConsentUrl() {
    const consentUrl = oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: gmailApiScopes
    })

    return consentUrl
}

function getGoogleAccessToken(accessCode) {
    return new Promise((resolve, reject) => {
        oauth2.getToken(accessCode, (err, tokens) => {
            if (err) return reject(err)

            oauth2.setCredentials(tokens)
            console.log(JSON.stringify(tokens, null, 2))
            resolve(tokens)
        })
    })
}

// EXPRESS STUFF
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.json({
        foo: 'bar'
    })
})

app.get('/request_google_consent', (req, res) => {
    res.json({
        url: getGoogleConsentUrl()
    })
})

app.get('/oauth2callback', (req, res) => {
    const { code } = req.query
    getGoogleAccessToken(code)
    .then(tokens => {
        res.json(tokens)
    })
    .catch(err => {
        res.json(err)
    })
})

server.on('request', app)

server.listen(3000)
