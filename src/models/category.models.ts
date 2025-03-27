import mongoose, { Schema } from "mongoose";

export interface ICategory {
    name: string;
    subCategories: mongoose.Types.ObjectId[];
}

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory"
    }]
}); 

const Category = mongoose.model<ICategory>("Category",categorySchema);
export default Category;
