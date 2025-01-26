import { NextResponse } from "next/server";

class ApiResponse extends NextResponse{
    constructor(message, data, success, status){
        return NextResponse.json({success, message, data}, {status});
    }
}

export default ApiResponse;