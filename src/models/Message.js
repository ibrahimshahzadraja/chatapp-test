import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        default: ""
    },
    image: {
        imageUrl: {
            type: String,
            default: ""
        },
        imageName: {
            type: String,
            default: ""
        }
    },
    voice: {
        type: String,
        default: ""
    },
    video: {
        videoUrl: {
            type: String,
            default: ""
        },
        videoName: {
            type: String,
            default: ""
        }
    },
    file: {
        fileUrl: {
            type: String,
            default: ""
        },
        fileName: {
            type: String,
            default: ""
        }
    },
    isSystemMessage: {
        type: Boolean,
        default: false
    },
    replyTo: {
        type: String,
        default: "",
    },
    replyUsername: {
        type: String,
        default: "",
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
