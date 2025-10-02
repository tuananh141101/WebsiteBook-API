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

        const redirectTo = process.env.NODE_ENV === "development" ? `${process.env.URL_VITE}/login` : process.env.NODE_ENV === "production" ? `${process.env.URL_PROD}/login` : ""

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password is required',
                options: {
                    redirectTo
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
                    role: "user",
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

router.get("/auth/users/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const {data,error} = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            return res.status(404).json({
                success: false,
                message: 'Notfound user',
                error: error.message
            });
        }
        res.json({
            success: true,
            data
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: 'Error server',
            error: error.message
        });
    }
})

router.patch("/auth/users/:id/address", async(req,res) => {
    try {
        const {id} = req.params;
        const {billing_address, shipping_address} = req.body;

        const updateData = {};
        if (billing_address) updateData.billing_address = billing_address;
        if (shipping_address) updateData.shipping_address = shipping_address;
        
        const {data, error} = await supabase
            .from("users")
            .update(updateData)
            .eq("id", iq)
            .select()
            .single()
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Update failed",
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Address update successful"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error server",
            error: error.message
        })
    }
})

router.post("/auth/logout", async(req,res) => {
    try {

    } catch(error) {
        res.status(500).json({
            success: false,
            message: "Error server",
            error: error.message
        })
    }
})

router.get("/admin/users", async(req,res) => {
    try {
        const {page = 1, limit = 10} = req.query

        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                autoRefreshToken: false,
                persistSession: false
            }
        )

        const {data: authUsers, error: authError} = await supabaseAdmin.auth.listUsers({
            page: parseInt(page),
            perPage: parseInt(limit)
        })

        const userIds = authUsers.users.map(u => u.id)
        const {data: publicUsers, error: publicError} = await supabaseAdmin
            .from("users")
            .select("*")
            .in("id", userIds)


    } catch(error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

module.exports = router