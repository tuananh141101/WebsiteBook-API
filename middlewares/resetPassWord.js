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



        
    } catch(error) {}
})
