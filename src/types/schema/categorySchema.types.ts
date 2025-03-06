import mongoose from "mongoose";


export interface ICategory {
    name: string;
    subCategories: mongoose.Schema.Types.ObjectId[];
}

export interface ISubCategory {
    name: string;
    imageUrl: string;
    category: mongoose.Schema.Types.ObjectId;
    about: string;
    events: mongoose.Schema.Types.ObjectId[];
}
