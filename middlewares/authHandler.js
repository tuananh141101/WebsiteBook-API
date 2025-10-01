require('dotenv').config();
const express = require('express');
const router = express.Router();
const {createClient} = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/auth/test-connection'm async (req,res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("id")
            .limit(1);
        
        if (error) {
            return res.status(500).json({
                suucess: false,
                message: "Connect fail",
                error: error.message
            })
        }

        res.json({
            success: true,
            message: "Success connect supabse",
            error: error.message
        })
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

