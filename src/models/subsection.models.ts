import mongoose, { Schema } from "mongoose";

// interface
export interface IEventSubSection {
    subCategoryId: mongoose.Types.ObjectId;
    price: number;
    about: string;
}


const subSectionSchema = new Schema({
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    price: {
        type: Number,
        required: true,
    },
    about: {
        type: String,
        required: true,
    }
}); 


const SubSection = mongoose.model<IEventSubSection>("SubSection",subSectionSchema);
export default SubSection;
