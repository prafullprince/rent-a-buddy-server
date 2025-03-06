import { v2 as cloudinary } from "cloudinary";

export const thumbnailToCloudinary = async (file:any,folder:any,height?:any,width?:any,quality?:any)=>{
    
    const options:any = { folder };

    if(height){
        options.height = height;
    }

    if(width){
        options.width = width;
    }

    if(quality){
        options.quality = quality;
    }

    options.resource_type = "auto";

    return await cloudinary.uploader.upload(file.tempFilePath, options);

}
