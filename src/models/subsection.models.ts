import mongoose, { Schema } from "mongoose";
import { IEventSubSection } from "../types/schema/eventSchema.types";


const subSectionSchema = new Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    price: {
        type: Number,
        required: true,
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
    },
    about: {
        type: String,
        required: true,
    }
}); 


const SubSection = mongoose.model<IEventSubSection>("SubSection",subSectionSchema);
export default SubSection;
