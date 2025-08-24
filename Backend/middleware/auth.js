// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function authMiddleware(req, res, next) {
    try {
        // Check if authorization header exists
        console.log("Headers received:", req.headers);
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "No authorization header provided" });
        }
        
        // Extract token from Bearer format
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ error: "Authorization format should be 'Bearer [token]'" });
        }
        
        const token = parts[1];
        console.log("Token received:", token);
        console.log("JWT_SECRET:", process.env.JWT_SECRET);
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);
        
        // Extract user ID from token
        const userId = decoded.userId;
        console.log("Extracted userId:", userId);
        
        if (!userId) {
            return res.status(401).json({ error: "Invalid token structure" });
        }
        
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({ error: "Email not verified" });
        }
        
        // Add user ID to request object
        req.userId = userId;
        req.user = {
            _id: user._id,
            name: user.name,
            UserName: user.UserName,
            email: user.email
        };
        
        next();
    } catch (error) {
        console.error("Auth error:", error);
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        
        return res.status(401).json({ error: "Authentication failed: " + error.message });
    }
}

module.exports = authMiddleware;