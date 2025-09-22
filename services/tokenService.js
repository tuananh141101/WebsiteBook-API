const fs = require('fs') // fs=file system module nodejs(read,wrtie,create file/folder)
const path = require('path') 

class TokenService {
  constructor() {
    this.resetTokensFile = path.join(__dirname, '../data/reset-tokens.json')
    this.ensureDataDirectory()
  }

  /**
   * Đảm bảo thư mục data tồn tại
   */
  ensureDataDirectory() {
    const dataDir = path.dirname(this.resetTokensFile)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
  }

  /**
   * Đọc tất cả reset tokens
   */
  getAllResetTokens() {
    try {
      if (fs.existsSync(this.resetTokensFile)) {
        const data = fs.readFileSync(this.resetTokensFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading reset tokens:', error)
    }
    return {}
  }

  /**
   * Lưu tất cả reset tokens
   */
  saveAllResetTokens(tokens) {
    try {
      fs.writeFileSync(this.resetTokensFile, JSON.stringify(tokens, null, 2))
      return true
    } catch (error) {
      console.error('Error saving reset tokens:', error)
      return false
    }
  }

  /**
   * Lưu một reset token mới
   */
  saveResetToken(token, tokenData) {
    try {
      const tokens = this.getAllResetTokens()
      
      // Cleanup expired tokens trước khi thêm token mới
      this.cleanupExpiredTokens()
      
      tokens[token] = {
        ...tokenData,
        createdAt: Date.now()
      }
      
      return this.saveAllResetTokens(tokens)
    } catch (error) {
      console.error('Error saving reset token:', error)
      return false
    }
  }

  /**
   * Lấy thông tin reset token
   */
  getResetToken(token) {
    try {
      const tokens = this.getAllResetTokens()
      return tokens[token] || null
    } catch (error) {
      console.error('Error getting reset token:', error)
      return null
    }
  }

  /**
   * Xóa một reset token
   */
  deleteResetToken(token) {
    try {
      const tokens = this.getAllResetTokens()
      
      if (tokens[token]) {
        delete tokens[token]
        return this.saveAllResetTokens(tokens)
      }
      
      return true // Token không tồn tại, coi như đã xóa thành công
    } catch (error) {
      console.error('Error deleting reset token:', error)
      return false
    }
  }

  /**
   * Xóa tất cả tokens của một user
   */
  deleteUserTokens(userId) {
    try {
      const tokens = this.getAllResetTokens()
      let changed = false
      
      Object.keys(tokens).forEach(token => {
        if (tokens[token].userId === userId) {
          delete tokens[token]
          changed = true
        }
      })
      
      if (changed) {
        return this.saveAllResetTokens(tokens)
      }
      
      return true
    } catch (error) {
      console.error('Error deleting user tokens:', error)
      return false
    }
  }

  /**
   * Cleanup các token đã hết hạn
   */
  cleanupExpiredTokens() {
    try {
      const tokens = this.getAllResetTokens()
      const now = Date.now()
      let changed = false
      
      Object.keys(tokens).forEach(token => {
        if (now > tokens[token].expires) {
          delete tokens[token]
          changed = true
        }
      })
      
      if (changed) {
        this.saveAllResetTokens(tokens)
        console.log('🗑️ Cleaned up expired tokens')
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
    }
  }

  /**
   * Thống kê tokens
   */
  getTokenStats() {
    try {
      const tokens = this.getAllResetTokens()
      const now = Date.now()
      
      const stats = {
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0 // trong 10 phút tới
      }
      
      Object.values(tokens).forEach(tokenData => {
        stats.total++
        
        if (now > tokenData.expires) {
          stats.expired++
        } else {
          stats.active++
          
          // Kiểm tra token sắp hết hạn (10 phút)
          if ((tokenData.expires - now) < 600000) {
            stats.expiringSoon++
          }
        }
      })
      
      return stats
    } catch (error) {
      console.error('Error getting token stats:', error)
      return { total: 0, active: 0, expired: 0, expiringSoon: 0 }
    }
  }

  /**
   * Kiểm tra rate limiting cho email
   * Ngăn spam reset password requests
   */
  checkRateLimit(email, windowMinutes = 15, maxAttempts = 3) {
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
        allowed: attempts < maxAttempts,
        attempts,
        maxAttempts,
        resetIn: windowMinutes
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
      // Cho phép nếu có lỗi
      return { allowed: true, attempts: 0, maxAttempts, resetIn: windowMinutes }
    }
  }

  /**
   * Scheduled cleanup - gọi định kỳ để dọn dẹp
   */
  startCleanupSchedule(intervalMinutes = 60) {
    // Cleanup ngay khi start
    this.cleanupExpiredTokens()
    
    // Cleanup định kỳ
    setInterval(() => {
      this.cleanupExpiredTokens()
    }, intervalMinutes * 60 * 1000)
    
    console.log(`🔄 Token cleanup scheduled every ${intervalMinutes} minutes`)
  }
}

module.exports = new TokenService()