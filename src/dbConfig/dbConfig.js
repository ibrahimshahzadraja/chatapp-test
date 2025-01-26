import mongoose from "mongoose";

let connection = null;

export const dbConnect = async () => {
    try {

        if (connection) {
            console.log("Database is already connected");
            return;
        }

        let dbConnection = await mongoose.connect(process.env.DB_URL + '/ChatApp');
        connection = dbConnection.connection.readyState;
        
        console.log("Database connected successfully");

    } catch (error) {
        console.log("Error in dbConnect", error);
    }
}