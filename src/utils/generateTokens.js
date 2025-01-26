import User from "@/models/User"
import ApiResponse from "@/helpers/ApiResponse"

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
    
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
    
        return {accessToken, refreshToken}
    } catch (error) {
        return new ApiResponse("Error while generating access and refresh token", null, false, 400);
    }
}