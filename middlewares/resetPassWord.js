require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseURL = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseURL, supabaseKey);

/**
 * POST/forgot-password
 * Gui email reset-password
 * **/
router.post('/forgot-password', async(req,res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                valid:false,
                message: 'Email is required'
            })
        }

        const {data: users, error:findError} = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single()
        if (findError || !users) {
            return res.json({
                success: true,
                message: "If the email exist, areset link has been sent"
            })
        }

        // Tao reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 1 phút la het han - (3600000 - 1hour)
        const nowISO = new Date().toISOString();
        const {error:saveError} = await supabase
            .from("reset_tokens")
            .upsert({
                    email: users.email,
                    token: resetToken,
                    user_id: users.id,
                    expires: tokenExpiry,
                    created_at: nowISO
                },
                { onConflict: ["user_id"] }
            )
        if (saveError) {
            console.error('Failed to save reset token:', saveError)
            return res.status(500).json({
                success: false,
                message: 'Faile to generate reset token'
            });
        }

        const resetUrl  = `${process.env.URL_VITE}/forget-password/sent?token=${resetToken}`
        try {
            await emailService.sendResetPasswordEmail(users.email, resetUrl, users.name)
            res.json({
                success: true,
                valid: true,
                message: 'Password reset email sent successfully',
                // Doan nay la development testing
                ...(process.env.NODE_ENV === 'development' && {
                    resetToken,
                    resetUrl
                })
            })
        } catch(emailError) {
            console.error("Email send error:", emailError)
            // Rmove token neu gui that bai
            // tokenService.deleteResetToken(resetToken)
            await supabase 
                .from("reset_tokens")
                .delete()
                .eq('token', resetToken)
            return res,status(500).json({
                success: false,
                valid: false,
                message: 'Failed to send reset eamail'
            });
        } 
    } catch(error) {
        console.error('🚨 ERROR:', error)
        console.error('🚨 STACK:', error.stack)
        console.error('Forgot password error:', error)
        res.status(500).json({
            success: false,
            valid: false,
            message: 'Internal server error'
        })
    }
})

/**
 * POST/forgot-password
 * Reset password voi token
 * **/
router.post('/reset-password', async (req,res) => {
    try {
        const {token, newPassword} = req.body;

        // Validation
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            })
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            })
        }

        const {data: tokenData, error: tokenError} = await supabase 
            .from("reset_tokens")
            .select("*")
            .eq("token", token)
            .single()
        if (tokenError || !tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            })
        }
        const nowISO = new Date().toISOString();
        // Kiem tra expiry
        if (nowISO > tokenData.expires) {
            await supabase  
                .from("reset_tokens")
                .delete()
                .eq('token', token)
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Token expired'
            })
        }

        // Hash password moi
        const hashedPassword = bcrypt.hashSync(newPassword, 10)
        // Cap nhap password
        // db.users[userIndex].password = hashedPassword
        // db.users[userIndex].updatedAt = new Date().toISOString()
        const {error: updateError} = await supabase
            .from("users")
            .update({
                password: hashedPassword,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenData.user_id)
        
        if (updateError) {
            console.error("Failed to update password:", updateError);
            return res.status(500).json({
                success: false,
                valid: false,
                message: 'Failed to update password'
            })
        }

        await supabase  
            .from("reset_tokens")
            .delete()
            .eq("token", token)
        res.json({
            success: true,
            valid: true,
            message: 'Password reset successfully'
        })        
    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({
            success: false,
            valid: false,
            message: 'Internal server error'
        })
    }
})

/**
 * GET /verify-reset-token/:token
 * Verify reset token validity
 * **/ 
router.get('/verify-reset-token/:token', async(req,res) => {
    try {
        const {token} = req.params
        if (!token) {
            return res.status(400).json({
                success: false,
                value: false,
                message: 'Token is required'
            })
        }
        
        // Lay token data
        const {data: tokenData, error: tokenError} = await supabase
            .from("reset_tokens")
            .select("*")
            .eq("token", token)
            .single()
        if (tokenError || !tokenData) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: "Invalid token"
            })
        }

        // Kiem tra expiry(het han)
        if (Date.now() > new Date(tokenData.expires).getTime()) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Token expired'
            })
        }
        res.json({
            success: true,
            valid: true,
            email: tokenData.email,
            expiresAt: new Date(tokenData.expires).toISOString()
        })
    } catch (error) {
        console.error('Verify token error:', error)
        res.status(500).json({
            success: false,
            valid: false,
            message: 'Internal server error'
        })
    }
})

module.exports = router