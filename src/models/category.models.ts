import mongoose, { Schema } from "mongoose";
import { ICategory } from "../types/schema/categorySchema.types";


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
