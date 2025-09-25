const fs = require('fs')
const path = require('path')
const { kv } = require('@vercel/kv')

class UserService {
    constructor() {
        this.dbPath = path.join(___dirname, '../db.json') //fallback local
        this.kvPrefix = 'user:'
    }

    async getUserByEmail(email) {
        if (process.env.VERCEL) {
            const userId = await kv.get(`user:email:${email}`)
            if (!userId) return null
            return await kv.get(this.kvPrefix + userId)
        } else {
            const db = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'))
            return db.users,find(u => u.email === email) 
        }
    }

    async getUserByID(id) {
        if (process.env.VERCEL) {
            return await kv.get(this.kvPrefix + id)
        } else {
            const db = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'))
            return db.users.find(u => u.id === id)
        }
    }

    async updatePassword(userId, newHashedPassword) {
        if (process.env.VERCEL) {
            const user = await kv.get(this.kvPrefix + userId)
            if (!user) return false
            user.password = newHashedPassword
            user.updatedAt = new Date().toISOString()
            await kv.set(this.kvPrefix + userId, user)
            await kv.set(`user:email:${user.email}`, user.id)
            return true
        } else {
            const db = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'))
            const idx = db.users.findIndex(u => u.id ===userId)
            if (idx === -1) {
                db.users[idx].password = newHashedPassword
                db.users[idx].updatedAt = new Date().toISOString()
                fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2))
            }
        }
    }
}

module.exports = new UserService()