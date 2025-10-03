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
                .upsert({
                    id: authData.user.id,             
                    email: authData.user.email,       
                    full_name: fullName || null,      
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
                }, {
                    onConflict: 'id' // chi dinh conflict key
                });
                // .eq('id', authData.user.id);
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

// Lay ttin users
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

// Cap nhap billing/shipping address
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

// Get all users (admin)
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

            // Merge data
            const mergeUsers = authUsers.users.map(authUser => {
                const publicUser = publicUsers?.find(p => p.id === authUser.id)
                return {
                    id: authUser.id,
                    email: authUser.email,
                    email_confirmed: !!authUser.email_confirmed_at,
                    created_at: authUser.created_at,
                    last_sign_in_at: authUser.last_sign_in_at,
                    ...publicUser
                }
            })

        res.json({
            success: true,
            data: mergeUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: authUsers.users.length
            }
        })
    } catch(error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

// Search user theo emmail(admin)
router.get("/auth/users/search", async(req,res) => {
    try {
        const {email} = req.query

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email parameter missing"
            })
        }

        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Get all users
        const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            })
        }

        const foundUser = authUsers.users.find(u => u.email.toLowerCase().includes(email.toLowerCase()))
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: "Not found users"
            })
        }

        // Lay ttin tu public.users
        const {data:publicUser} = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", foundUser.id)
            .single()
        res.json({
            success: true,
            data: {
                id: foundUser.id,
                email: foundUser.email,
                email_confirmed: !!foundUser.email_confirmed_at,
                created_at: foundUser.created_at,
                last_sign_in_at: foundUser.last_sign_in_at,
                ...publicUser
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

// Dem tong so users(admin)
router.get("/auth/users/stats", async(req,res) => {
    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        // Lay tat ca users
        const {data:authUsers,error} = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            })
        }
        const totalUsers = authUsers.users.length
        const confirmedUsers = authUsers.users.filter(u => u.email_confirmed_at).length
        const unconfirmedUsers = totalUsers - confirmedUsers

        res.json({
            success: true,
            data: {
                total_users: totalUsers,
                confirmed_uers: confirmedUsers,
                unconfirmed_users: totalUsers > 0
                    ? Math.round((confirmedUsers / totalUsers) * 100)
                    : 0
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

// Del users
router.delete("/auth/admin/users/:id", async(req,res) => {
    try {
        const {id} = req.params

        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Xoa tu auth.users 
        // Public.users(child) se tu dong xoa theo
        const {error} = await supabaseAdmin.auth.deleteUser(id)

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Delete user failed",
                error: error.message
            })
        }

        res.json({
            success: true,
            message: "Remove users success (auth.users & public.users)"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error server",
            error: error.message
        })
    }
})

module.exports = router