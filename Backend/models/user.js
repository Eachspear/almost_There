//for testing
const mongoose = require("mongoose");
const {createHmac, randomBytes} = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    UserName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        // Remove the unique: true constraint for development
        // unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profile: {
        type: String,
        default: "./images/profileImage.jpg",
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
    },
    verificationTokenExpiry: {
        type: Date
    }
}, {timestamps: true});

// Add a flag to check if password is modified to prevent rehashing during save
userSchema.pre("save", function(next) {
    // Only hash password if it's new or being changed
    if (!this.isModified('password')) {
        return next();
    }
    
    const user = this;
    const secret = randomBytes(16).toString();
    const hashedPassword = createHmac("sha256", secret)
        .update(user.password)
        .digest("hex");
    
    this.salt = secret;
    this.password = hashedPassword;
    next();
});

userSchema.static("matchPassword", async function(email, password) {
    try {
        const user = await this.findOne({email});
        if (!user)
            throw new Error("Invalid email please enter correct email");
        if (!user.isVerified)
            throw new Error("Email Not verified");
        
        const secret = user.salt;
        console.log("Retrieved salt:", secret);
        
        const checkPassword = createHmac("sha256", secret)
            .update(password)
            .digest("hex");
        
        console.log("Stored hash:", user.password);
        console.log("Calculated hash:", checkPassword);
        
        if (checkPassword === user.password) {
            // Return the user document directly instead of using spread
            // This preserves the ObjectId structure
            return user;
        } else {
            throw new Error("Wrong Password");
        }
    } catch (error) {
        throw error;
    }
});

const user = mongoose.model("user", userSchema);

module.exports = user;
//For Deployment 
/*const mongoose = require("mongoose");
const {createHmac, randomBytes} = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    UserName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profile: {
        type: String,
        default: "./images/profileImage.jpg",
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
    },
    verificationTokenExpiry: {
        type: Date
    }
}, {timestamps: true});

// Add a flag to check if password is modified to prevent rehashing during save
userSchema.pre("save", function(next) {
    // Only hash password if it's new or being changed
    if (!this.isModified('password')) {
        return next();
    }

    const user = this;
    const secret = randomBytes(16).toString();
    const hashedPassword = createHmac("sha256", secret)
        .update(user.password)
        .digest("hex");

    this.salt = secret;
    this.password = hashedPassword;
    next();
});

userSchema.static("matchPassword", async function(email, password) {
    try {
        const user = await this.findOne({email});
        if (!user)
            throw new Error("Invalid email please enter correct email");
        if (!user.isVerified)
            throw new Error("Email Not verified");
        
        const secret = user.salt;
        console.log("Retrieved salt:", secret);
        
        const checkPassword = createHmac("sha256", secret)
            .update(password)
            .digest("hex");
        
        console.log("Stored hash:", user.password);
        console.log("Calculated hash:", checkPassword);
        
        if (checkPassword === user.password) {
            // Return the user document directly instead of using spread
            // This preserves the ObjectId structure
            return user;
        } else {
            throw new Error("Wrong Password");
        }
    } catch (error) {
        throw error;
    }
});
const user = mongoose.model("user", userSchema);

module.exports = user;*/