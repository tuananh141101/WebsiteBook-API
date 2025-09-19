const fs = require('fs') // fs=file system module nodejs(read,wrtie,create file/folder)
const path = require('path') 

class TokenService {
    constructor() {
        this.resetTokensFile = path.join(___dirname, '../data/reset-tokens.json')
        this.ensureDataDiectory()
    }

    // Dam bao thu muc data co, neu chua thi tao 
    ensureDataDiectory() {
        const dataDir = path.dirname(this.resetTokensFile)
        if (!fs.existsSync(dataDir)) { 
            fs.mkdirSync(dataDir, {recursive: true}) //mkdirSync create, recursive create ca cay folder
        }
    }

    // Doc tat ca reset tokens
    getAllResetTokens() {
        try {
            if (fs.existsSync(this.resetTokensFile)) {
                const data = fs.readFileSync(this.resetTokensFile, 'utf8')
                return JSON.parse(data)
            }
        } catch(error) {
            console.error("Error reading reset tokens:", error)
        }
        return {}
    }

    // Luu tat ca reset token
    saveAllResetTokens(tokens) {
        try {
            fs.writeFileSync(this.resetTokensFile, JSON.stringify(tokens, null, 2)) 
            // - JSON.stringify(tokens, null, 2):
            //    + Chuyen object `tokens` thanh JSON
            //    + null = khong dung  replacer
            //    + 2 = Khoang cach thut le (indentation 2 spaces)
            return true
        } catch(error) {
            console.error("Error saving reset tokens:", error)
            return false
        } 
    }

    // Luu mot reset token moi
    saveResetToken(token,tokenData) {
        try {
            const tokens = this.getAllResetTokens()

            // Cleanup tokens het han trc khi them token moi
            this.cleanUpExpiredTokens()

            // Them moi token vao tokens{}
            tokens[token] = {
                ...tokenData,
                createdAt: Date.now()
            }
        } catch(error) {
            console.error("Error saving rset token:", error)
            return false
        }
    }

    // Lay thong tin reset token
    getResetToken(token) {
        try {
            const tokens= this.getAllResetTokens()
            return tokens[token] || null
        } catch(error) {
            console.error("Error getting reset token:", error)
            return null
        }
    }

    //Xoa mot reset token
    deleteResetToken(token) {
        try {
            const tokens = this.getAllResetTokens()

            if (tokens[token]) {
                delete tokens[token]
                return this.saveAllResetTokens(tokens)
            }
            return true
        } catch(error) {
            console.error("Error deleting reset token:", error)
            return false
        }
    }

    // Xoa tat ca tokens cua mot user
    deleteUserTokens(userId) {
        try {
            const tokens = this.getAllResetTokens()
            let changed = false

            Object.keys(tokens).forEach(token => {
                if (tokens[token].userId === userId) {
                    delete tokens[token]
                    changed = true
                }
                if (changed) {return this.saveAllResetTokens(tokens)}
                return true
            })
        } catch(error) {
            console.error("Error deleting user tokens:", error)
            return false
        }
    }

    // Cleanup cac token da het han 
    cleanupExpiredTokens() {
        try {
            const tokens = this.getAllResetTokens();
            const now = Date.now();
            let changed = false;

            Object.keys(tokens).forEach(token => {
                if (now > tokens[token].expires) {
                    delete tokens[token]
                    changed = true
                }
            })
            if (changed) {
                this.saveAllResetTokens()
                console.log('Cleaned up expired tokens')
            }
        } catch(error) {
            console.error("Error cleaning up expired tokens:", error)
        } 
    }

    // Thong ke tokens
    getTokenStates() {
        try {
            const tokens = this.getAllResetTokens()
            const now = Date.now()
            const stats = {
                total: 0, //tong so token
                active: 0, //so token con han
                expired: 0, //so token da het han 
                expiringSoon: 0 // so token sap het han trong 10 phut toi
            }
            Object.values(tokens).forEach(tokenData => {
                stats.total++

                if (now > tokenData.expires) {
                    stats.expired++
                } else {
                    stats.active++
                    // KIem tra token sap het han(10phut)
                    if ((tokenData.expires - now) < 600000) {
                        stats.expiringSoon++
                    }
                }
            })
            return stats
        } catch (error) {
            console.error("Error getting token stats:", error)
            return {total: 0, expired: 0, expriringSoon: 0}
        }
    }

    // Kiem tra rate limiting cho email
    // Ngan spam reset password request
    checkRateLimit(email, windowMinutes = 15, maxAttemppts = 3) {
        try {
            const tokens = this.getAllResetTokens()
            const now = Date.now()
            const windowStart = now - (windowMinutes * 60 * 1000)

            let attempts = 0
            
            Object.values(tokens).forEach(tokenData => {
                if (tokenData.email === email && tokenData.createdAt > windowStart) {
                    attempts++
                }
            })

            return {
                allowed: attempts < maxAttemppts,
                attempts,
                maxAttemppts,
                restIn: windowMinutes
            }
        } catch(error) {
            console.error("Error checking rate limit", error)
            return { allowed: true, attempts: 0,maxAttemppts, resetIn: windowMinutes }
        }
    }


    // Scheduled cleanup 
    startCleanupSchedule(intervalMinute = 60) {
        // Cleanup ngay khi start
        this.cleanupExpiredTokens()

        // Cleanup dinh ky 
        setInterval(() => {
            this.cleanupExpiredTokens()
        }, intervalMinute * 60 * 1000)
    }

}