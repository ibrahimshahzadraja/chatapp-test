import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    isSystemMessage: {
        type: Boolean,
        default: false
    },
    sendTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    sendBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, {timestamps: true});

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;