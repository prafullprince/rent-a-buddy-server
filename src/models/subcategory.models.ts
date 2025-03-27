import mongoose, { Schema } from "mongoose";


export interface ISubCategory {
    name: string;
    imageUrl: string;
    category: mongoose.Types.ObjectId;
    about: string;
    events: mongoose.Types.ObjectId[];
}


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
