hconst nodemailer = require('nodemailer')

class emailService {
    constructor() {
        this.transporter = this.createTransporter()
    }

    createTransporter() {
        // Development: Sử dụng Ethereal Email (fake SMTP)
        if (process.env.NODE_ENV === 'development') {
            return nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
                }
            })
        }
        // Production: Cấu hình theo provider
        if (process.env.EMAIL_PROVIDER === 'gmail') {
            return nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
                }
            })
        }
        // SMTP provider khác
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_HOST || 587,
            secure: process.env.STMP_SECURE === 'true',
            auth: {
                user: process.env.STMP_USER,
                pass: process.env.STMP_PASS
            }
        })
    }

    // Gui email reset password
    async sendResetPasswordEmail(to, resetUrl, username = '') {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@bookstore.com',
            to: to,
            subject: 'Password Reset Request',
            html: this.getResetPasswordTemplate(resetUrl, username)
        }

        // Development chi log 
        if (process.env.NODE_ENV === 'development') {
            console.log('\n📧 ===== EMAIL LOG (Development) =====')
            console.log('To:', to)
            console.log('Subject:', mailOptions.subject)
            console.log('Reset URL:', resetUrl)
            console.log('=====================================\n')

            // Simulate success
            return Promise.resolve({
                messageId: 'dev-' + Date.now(),
                response: 'Email logged to console (development mode)'
            })
        }

        // Production
        try {
            const info = await this.transporter.sendMail(mailOptions)
            console.log('Email sent successfully:', info.messageId)
        } catch (error) {
            console.error('Email sent failed:',error)
            throw error
        }
    }

    // Template HTML cho email reset password
    getResetPassWordTemplate(resetUrl, userName) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .content {
                    padding: 30px 20px;
                }
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName || 'there'},</p>
                    <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    <div class="warning">
                        <strong>⚠️ Important:</strong>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this, please ignore this email</li>
                            <li>Your password won't be changed unless you click the link above</li>
                        </ul>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                        ${resetUrl}
                    </p>
                </div>
                <div class="footer">
                    <p>This email was sent automatically. Please do not reply.</p>
                    <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    }

    // Gui email thong bao password da doi thanh cong 
    async snedPasswordChangeNOtification(to, userName = "") {
        const mailOptions = {
            from: process.env.FROM_EMAIL || "noreply@bookstore.com",
            to: to,
            subject: 'Password Changed Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">✅ Password Changed Successfully</h2>
                    <p>Hello ${userName || 'there'},</p>
                    <p>This is to confirm that your password has been changed successfully.</p>
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    <p>Best regards,<br>Your App Team</p>
                </div>
            `
        }
        if (process.env.NODE_ENV === "development") {
            console.log('\n📧 ===== PASSWORD CHANGED NOTIFICATION =====')
            console.log('To:', to)
            console.log('Subject:', mailOptions.subject)
            console.log('==========================================\n')
            return Promise.resolve()
        }
        return this.transporter.sendMail(mailOptions)
    }
}

module.exports = new emailService();