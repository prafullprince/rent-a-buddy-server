import mongoose, { Schema } from "mongoose";
import { ICategory, ISubCategory } from "../types/schema/categorySchema.types";


const subCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    about: {
        type: String,
        required: true
    },
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    }]
}); 

const SubCategory = mongoose.model<ISubCategory>("SubCategory",subCategorySchema);
export default SubCategory;
