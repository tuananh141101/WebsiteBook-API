require('dotenv').config();
const express = require('express');
const router = express.Router();
const {createClient} = require('@supabase/supabase-js');
const supabase_url = process.env.SUPABASE_URL;
const supabse_key = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabase_url, supabse_key);

// router.get('/auth/test-connection', async (req,res) => {
//     try {
//         const { data, error } = await supabase
//             .from("users")
//             .select("id")
//             .limit(1)
//             .maybeSingle()
        
//         if (error) {
//             return res.status(500).json({
//                 success: false,
//                 message: "Connect fail",
//                 error: error.message
//             })
//         }

//         console.log("check data", data);

//         res.json({
//             success: true,
//             message: "Success connect supabse",
//             data
//         })
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error server",
//             error: error.message
//         })
//     }
// })

// Tao tai khoan
router.post('/auth/signup', async(req,res) => {
    try {
        const { email,password,fullName } = req.body;

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password is required',
                options: {
                    emailRedirectTo: `${process.env.URL_VITE}/login`
                }
            })
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        })

        if (authError) {
            return res.status(400).json({
                success: false,
                message: 'Registration failed',
                error: authError.message
            })
        }

        // Bổ sung thông tin vào bảng users (nếu trigger chưa tạo đủ)
        if (authData.user) {
            const {error: updateError} = await supabase 
                .from("users")
                .update({
                    fullName: fullName | null,
                    billing_address: {
                        type: "billing",
                        fullname: "",
                        address: "",
                        phone: "",
                        email: "",
                    },
                    shipping_address: {
                        type: "shipping",
                        fullname: "",
                        address: "",
                        phone: "",
                        provinceId: "",
                        districtId: "",
                        wardId: ""                        
                    }
                })
                .eq('id', authData.user.id);
            if (updateError) {console.error("Error update profile")}
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Check your email for verification',
            users: {
                id: authData.user.id,
                email: authData.user.email
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error server",
            error: error.message
        })
    }
})

// Dang nhap tai khoan
router.post("/auth/login", async(req,res) => {
    try {
        const { email,password } = req.body;

        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: 'Email and password required'
            })
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(501).json({
                success: false,
                valid: false,
                message: "Login failed"
            });
        }

        // Lay thong tin chi tiet tu tb users
        const { data:userData,error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single()
        if (userError) console.error("Error get info user:", userError);

        res.json({
            success: true,
            message: "Login success",
            user: {
                id: authData.user.id,
                email: authData.user.email,
                ...userData
            },
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error server",
            error: error.message
        })
    }
})

// router.post('/auth/signup', async (req, res) => {
//     // 1. Lấy email và password từ request body (Postman)
//     const { email, password } = req.body;

//     if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

//     try {
//         // 2. Gọi hàm đăng ký của Supabase
//         const { data, error } = await supabase.auth.signUp({
//             email,
//             password,
//         });

//         if (error) {
//             return res.status(400).json({ 
//                 error: error.message,
//                 details: error
//             });
//         }

//         // 3. Phản hồi thành công
//         res.status(200).json({
//             message: 'User registered successfully!',
//             user: data.user,
//             session: data.session
//         });

//     } catch (err) {
//         // Xử lý lỗi server không mong muốn
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// router.post('/auth/signin', async (req, res) => {
//     // 1. Lấy email và password từ request body (Postman)
//     const { email, password } = req.body;

//     if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

//     try {
//         // 2. Gọi hàm đăng ký của Supabase
//         const { data, error } = await supabase.auth.signInWithPassword({
//             email,
//             password,
//         });

//         if (error) {
//             return res.status(400).json({ 
//                 error: error.message,
//                 details: error
//             });
//         }

//         res.status(200).json({
//             message: 'User signin successfully!',
//             user: data.user,
//             session: data.session
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

module.exports = router