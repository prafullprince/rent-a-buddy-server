import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../helper/apiResponse.helper";
import jwt from "jsonwebtoken"
import { UserPayload } from "../../express";


// auth
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<any>=>{
    try {
        // fetch token
        const token = req.cookies?.token || req.header("Authorization")?.replace('Bearer ','');

        // validation
        if(!token){
            return ErrorResponse(res,404,"Token not found");
        }

        // if found then decode and attach in user
        try {
            // decode            
            const decode = jwt.verify(token, process.env.JWT_SECRET!);
            // if (typeof decode === "string") {
            //     return ErrorResponse(res,404,"Authorization failed");
            // }
            req.user = decode as UserPayload;

            next();
        } catch (error) {
            console.log(error);
            return ErrorResponse(res,404,"Authorization failed");
        }

    } catch (error) {
        console.log(error);
        return ErrorResponse(res,500,"Internal server error");
    }
}


// isUser
export const isUser = async (req: Request, res: Response, next: NextFunction): Promise<any>=>{
    try {
       
        // fetch userId
        const userId = req.user?.id;
        
        // validation
        if(!userId){
            return ErrorResponse(res,404,"User not found");
        }

        // verify user role
        if(req.user?.role !== "User"){
            return ErrorResponse(res,403,"You are not authorized to access this resource");
        }
        
        next();
    } catch (error) {
        console.log(error);
        return ErrorResponse(res,500,"Internal server error");
    }
}


// isAdmin
export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any>=>{
    try {
       
        // fetch userId
        const userId = req.user?.id;
        
        // validation
        if(!userId){
            return ErrorResponse(res,404,"User not found");
        }

        // verify user role
        if(req.user?.role !== "Admin"){
            return ErrorResponse(res,403,"You are not authorized to access this resource");
        }
        
        next();
    } catch (error) {
        console.log(error);
        return ErrorResponse(res,500,"Internal server error");
    }
}


// isBuddy
export const isBuddy = async (req: Request, res: Response, next: NextFunction): Promise<any>=>{
    try {
       
        // fetch userId
        const userId = req.user?.id;
        
        // validation
        if(!userId){
            return ErrorResponse(res,404,"User not found");
        }

        // verify user role
        if(req.user?.role !== "Buddy"){
            return ErrorResponse(res,403,"You are not authorized to access this resource");
        }
        
        next();
    } catch (error) {
        console.log(error);
        return ErrorResponse(res,500,"Internal server error");
    }
}
