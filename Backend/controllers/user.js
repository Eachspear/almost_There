const user = require("../models/user");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const UserInterests=require("../models/userinterests")

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'mohitkarande2004@gmail.com',
        pass: 'chig lgxd wkov iqvf'
    }
});

function getSignin(req, res) {
    return res.json({signin: "please sign in"});
}
//for Deployment
/*async function createUser(req, res) {
    const {name, UserName, email, password} = req.body;
    
    if (!name || !UserName || !email || !password) {
        return res.status(400).json({error: "All fields are required!"});
    }
    
    try {
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        
        const newUser = await user.create({
            name,
            UserName,
            email,
            password,
            verificationToken
        });
        
        const verificationLink = `http://localhost:8500/user/verify/${verificationToken}`;
        
        const mailOptions = {
            from: 'mohitkarande2004@gmail.com',
            to: email,
            subject: 'Email Verification for InstaHang',
            html: `
                <h1>Welcome to InstaHang!</h1>
                <p>Hello ${name},</p>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not create this account, please ignore this email.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        return res.status(201).json({
            message: "User created successfully. Please check your email to verify your account."
        });
    } catch (error) {
        console.error("User creation error:", error);
        if (error.code === 11000) {  
            return res.status(400).json({error: "Email already exists"});
        }
        return res.status(500).json({error: "Server error"});
    }
}*/
//for testing
async function createUser(req, res) {
    const {name, UserName, email, password} = req.body;
    
    if (!name || !UserName || !email || !password) {
        return res.status(400).json({error: "All fields are required!"});
    }
    
    try {
        // Generate token for verification (even if we auto-verify)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // For development: create user with isVerified set to true
        const newUser = await user.create({
            name,
            UserName,
            email,
            password,
            verificationToken,
            isVerified: true // Auto-verify for development
        });
        
        // For development, we can still send the verification email
        // but it's not necessary to click it
        const verificationLink = `http://localhost:8500/user/verify/${verificationToken}`;
        
        const mailOptions = {
            from: 'mohitkarande2004@gmail.com',
            to: email,
            subject: 'Email Verification for InstaHang',
            html: `
                <h1>Welcome to InstaHang!</h1>
                <p>Hello ${name},</p>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not create this account, please ignore this email.</p>
                <p>Note: For development, your account is already verified.</p>
            `
        };
        
        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Email sending failed, but continuing:", emailError);
            // Continue anyway since we're auto-verifying
        }
        
        return res.status(201).json({
            message: "User created successfully. Account is auto-verified for development.",
            user: {
                id: newUser._id,
                name: newUser.name,
                UserName: newUser.UserName,
                email: newUser.email,
                isVerified: newUser.isVerified
            }
        });
    } catch (error) {
        console.error("User creation error:", error);
        if (error.code === 11000) {  
            return res.status(400).json({error: "Email already exists"});
        }
        return res.status(500).json({error: "Server error: " + error.message});
    }
}
// controllers/user.js - Updated AuthenticateUser function
// Add this at the top of your user.js controller

async function AuthenticateUser(req, res) {
    const {email, password, latitude, longitude} = req.body;
    
    if (!email || !password)
        return res.status(400).json({error: "All fields are required"});
    
    try {
        const User = await user.matchPassword(email, password);
        console.log("Authenticated user:", User);
        if (!User.isVerified) {
            return res.status(401).json({
                error: "Please verify your email before logging in",
                needsVerification: true
            });
        }
        
        // Check if User has the _id property directly
        let userId;
        if (User._id) {
            userId = User._id.toString();
        } else if (User._doc && User._doc._id) {
            // If User is a mongoose document, _id might be in _doc
            userId = User._doc._id.toString();
        } else {
            // If neither, log the full user object for debugging
            console.error("User object structure:", JSON.stringify(User, null, 2));
            return res.status(500).json({error: "Could not extract user ID"});
        }
        
        console.log("Extracted userId for token:", userId);
        
        // Create JWT token with userId
        const token = jwt.sign(
            { userId: userId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        // If location data is provided, update location
        if (latitude && longitude) {
            try {
                const UserLocation = require("../models/userlocation");
                await UserLocation.findOneAndUpdate(
                    { userId: userId },
                    { 
                        userId: userId,
                        latitude, 
                        longitude,
                        location: {
                            type: "Point",
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        lastUpdated: Date.now() 
                    },
                    { upsert: true }
                );
            } catch (locErr) {
                console.error("Location update error:", locErr);
                // Continue anyway, location update is not critical
            }
        }
        
        // Check if user has completed their interests profile
        let isProfileComplete = false;
        try {
            const interestsProfile = await UserInterests.findOne({ userId: userId });
            isProfileComplete = interestsProfile ? interestsProfile.isProfileComplete : false;
        } catch (profileErr) {
            console.error("Profile check error:", profileErr);
            // Continue anyway, profile check is not critical
        }
        
        // Return success with token and profile completion status
        return res.status(200).json({
            message: "User Logged In Successfully",
            token,
            user: {
                id: userId,
                name: User.name || (User._doc ? User._doc.name : null),
                UserName: User.UserName || (User._doc ? User._doc.UserName : null), 
                email: User.email || (User._doc ? User._doc.email : null),
                isProfileComplete: isProfileComplete
            }
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        return res.status(401).json({error: error.message});
    }
}
async function verifyEmail(req, res) {
    try {
        const { token } = req.params;
        
        // Find user with the token
        const User = await user.findOne({
            verificationToken: token
        });
        
        if (!User) {
            return res.status(400).json({
                error: "Invalid verification token"
            });
        }
    
        await user.findOneAndUpdate(
            { _id: User._id },
            { 
                isVerified: true,
                verificationToken: undefined,
                verificationTokenExpiry: undefined
            }
        );
        
        return res.end("Email verified Succesfully"); 
        
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({error: "Server error"});
    }
}

// Resend verification email if needed
async function resendVerificationEmail(req, res) {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({error: "Email is required"});
    }
    
    try {
        const User = await user.findOne({ email });
        
        if (!User) {
            return res.status(404).json({error: "User not found"});
        }
        
        if (User.isVerified) {
            return res.status(400).json({error: "Email is already verified"});
        }
        
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        User.verificationToken = verificationToken;
        
        await User.save();
        
        // Create verification link
        const verificationLink = `http://localhost:8500/user/verify/${verificationToken}`;
        
        // Send verification email
        const mailOptions = {
            from: 'mohitkarande2004@gmail.com',
            to: email,
            subject: 'Email Verification for InstaHang',
            html: `
                <h1>Welcome to InstaHang!</h1>
                <p>Hello ${User.name},</p>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not create this account, please ignore this email.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        return res.status(200).json({
            message: "Verification email resent. Please check your inbox."
        });
        
    } catch (error) {
        console.error("Error resending verification email:", error);
        return res.status(500).json({error: "Server error"});
    }
}

module.exports = {
    getSignin,
    createUser,
    AuthenticateUser,
    verifyEmail,
    resendVerificationEmail
};