import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

export const cloudinaryConnect = async ()=>{
    try {
		cloudinary.config({
			//!    ########   Configuring the Cloudinary to Upload MEDIA ########
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
		});
	} catch (error) {
		console.log("error in cludinary config",error);
	}
}
