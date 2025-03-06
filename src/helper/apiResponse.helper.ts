import { Response } from "express"

export const ErrorResponse = (res:Response, status:number, message:string)=>{
    return res.status(status).json({
        success:false,
        message: message
    })
}

export const SuccessResponse = (res:Response, status:number, message:string, data:any)=>{
    return res.status(status).json({
        success:true,
        message: message,
        data
    })
}
