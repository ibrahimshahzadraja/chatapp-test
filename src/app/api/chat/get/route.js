import ApiResponse from "@/helpers/ApiResponse";
import Chat from "@/models/Chat";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const {chatname} = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.aggregate([
        {
            $match: { chatname }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "_id",
                as: "membersArray"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "banned",
                foreignField: "_id",
                as: "bannedArray"
            }
        },
        {
            $addFields: {
                isOwner: { $eq: ["$owner", new mongoose.Types.ObjectId(userId)] },
                isMember: { $in: [new mongoose.Types.ObjectId(userId), "$members"] },
                isAdmin: { $in: [new mongoose.Types.ObjectId(userId), "$admins"] }
            }
        },
        {
            $addFields: {
                fullData: {
                    isAuthorized: true,
                    chatname: "$chatname",
                    profilePicture: "$profilePicture",
                    backgroundImage: "$backgroundImage",
                    memberDetails: {
                        $concatArrays: [
                            [{
                                username: { $arrayElemAt: ["$ownerDetails.username", 0] },
                                profilePicture: { $arrayElemAt: ["$ownerDetails.profilePicture", 0] },
                                isOwner: true,
                                isAdmin: true,
                                isBanned: false
                            }],
                            {
                                $map: {
                                    input: "$membersArray",
                                    as: "member",
                                    in: {
                                        username: "$$member.username",
                                        profilePicture: "$$member.profilePicture",
                                        isOwner: false,
                                        isAdmin: { $in: ["$$member._id", "$admins"] },
                                        isBanned: { $in: ["$$member._id", "$banned"] }
                                    }
                                }
                            }
                        ]
                    },
                    memberUsernames: {
                        $concatArrays: [
                            [{ $arrayElemAt: ["$ownerDetails.username", 0] }],
                            "$membersArray.username"
                        ]
                    },
                    bannedUsernames: "$bannedDetails.username",
                    isOwner: "$isOwner",
                    isAdmin: "$isAdmin",
                },
                limitedData: {
                    isAuthorized: false,
                }
            }
        },
        {
            $project: {
                _id: 0,
                result: {
                    $cond: {
                        if: { $or: ["$isOwner", "$isMember"] },
                        then: "$fullData",
                        else: "$limitedData"
                    }
                }
            }
        },
        {
            $replaceRoot: { newRoot: "$result" }
        }
    ]);

    if(!chat || chat.length === 0){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const response = new ApiResponse("Chat found", chat[0], true, 200);

    if(authData.tokenChanged){
		response.cookies.set('accessToken', authData.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge: 3 * 24 * 60 * 60,
		});
		
		response.cookies.set('refreshToken', authData.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'strict',
		maxAge: 365 * 24 * 60 * 60
		});
	}

    return response;
}