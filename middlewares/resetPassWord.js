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

        // Doc user
        // const dbPath = path.join(__dirname, "../db.json");
        // let db
        // try {
        //     db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        //     console.log("doc user")
        // } catch(error) {
        //     console.error("Dababase read error:", error);
        //     return res.status(500).json({
        //         success: false,
        //         message: "Dababase error"
        //     })
        // }

        // Tim user
        // const user = db.users.find(u => u.email === email);
        // console.log("tim user")
        // if (!user) {
        //     return res.json({
        //         success: true,
        //         message: "If the mail exists, a reset link has been sent"
        //     })
        // }
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
        // // Luu token
        // const success = tokenService.saveResetToken(resetToken, {
        //     userId: user.id,
        //     email: user.email,
        //     expires: tokenExpiry
        // })
        // if (!success) {
        //     return res.status(500).json({
        //         success: false,
        //         message: 'Failed to generate reset token'
        //     })
        // }
        // const {error:saveError} = await supabase
        //     .from("reset_tokens")
        //     .insert({
        //         token: resetToken,
        //         user_id: users.id,
        //         email: users.email,
        //         expires: tokenExpiry,
        //         created_at: nowISO
        //     })
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

        // Kiem tra token
        // const tokenData = tokenService.getResetToken(token)
        // if (!tokenData) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid or expired reset token'
        //     })
        // }
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

        // Doc database
        // const dbPath = path.join(__dirname, '../db.json')
        // let db 
        // try {
        //     db = JSON.parse(fs.readFileSync(dbPath, 'utf8')) //readFileSync  doc file dong bo (ngung toan bo chuong trinh cho den khi doc xong)
        // } catch (error) {
        //     console.error('Database read error:',error)
        //     return res.status(500).json({
        //         success: false,
        //         message: 'Database error'
        //     })
        // }

        // Tim user
        // const userIndex = db.users.findIndex(u => u.id === tokenData.userId)
        // if (userIndex === -1) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'User not found'
        //     })
        // }

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

        // Luu database 
        // try {
        //     fs.writeFileSync(dbPath, JSON.stringify(db,null,2))
        // } catch (error) {
        //     console.error("Database write error:", error)
        //     return res.status(500).json({
        //         success: false,
        //         message: 'Failed to update password'
        //     })
        // }

        // Xoa token da su dung
        // tokenService.deleteResetToken(token)
        // res.json({
        //     success: true,
        //     message: 'Password reset successfully'
        // })
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

        // const tokenData = tokenService.getResetToken(token)
        // if (!tokenData) {
        //     return res.status(400).json({
        //         success: false,
        //         valid: false,
        //         message: 'Invalid token'
        //     })
        // }
        
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
            // tokenService.deleteResetToken(token)
            // await supabase
            //     .from('reset_tokens')
            //     .delete()
            //     .eq("token", token)
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