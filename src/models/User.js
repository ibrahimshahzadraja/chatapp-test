import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/resend";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    profilePicture: {
        type: String,
        default: "",
    },
    verifyCode: {
        type: String,
        required: true,
    },
    verifyCodeExpiry: {
        type: Date,
        default: Date.now() + 10 * 60 * 1000,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    chats:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            default: [],
        }
    ],
    chatsLeft: {
        type: Number,
        default: 5,
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("verifyCode")) return next()
    
    this.verifyCode = await bcrypt.hash(this.verifyCode, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.isVerifyCodeCorrect = async function (verifyCode) {
    return await bcrypt.compare(verifyCode, this.verifyCode)
}

userSchema.methods.renewVerifyCode = async function () {
    this.verifyCode = Math.floor(100000 + Math.random() * 900000)
    await sendEmail(this.email, this.verifyCode);
    this.verifyCodeExpiry = Date.now() + 10 * 60 * 1000
    await this.save({ validateBeforeSave: false })
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;