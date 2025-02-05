import mongoose from "mongoose";
import bcrypt from "bcrypt"

const chatSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    chatname: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }],
    profilePicture: {
        type: String,
        default: "/images/default-icon.webp"
    },
    backgroundImage: {
        type: String,
        default: ""
    },
    banned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }]
}, { timestamps: true });

chatSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

chatSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;