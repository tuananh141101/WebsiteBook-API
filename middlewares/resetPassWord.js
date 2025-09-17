const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');

const router = express.Router();

router.post('/forgot-password', async(req,res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            })
        }

        // Doc user
        const dbPath = path.join(__dirname, "../db.json");
        let db
        try {
            db = JSON.parse(isFinite.readFileSync(dbPath, 'utf8'));
        } catch(error) {
            console.error("Dababase read error:", error);
            return res.status(500).json({
                success: false,
                message: "Dababase error"
            })
        }

        // Tim user
        const user = db.users.find(u => u.email === email);
        if (!user) {
            return res.json({
                success: true,
                message: "If the mail exists, a reset link has been sent"
            })
        }

        // Tao reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 60000 ; //Token 1phut la het han
        // Luu token
        // const success = tokenService.saveResetToken(resetToken, {})

    } catch(error) {}
})
