import mongoose, { Schema } from "mongoose";
import { IEventSection } from "../types/schema/eventSchema.types";


const sectionSchema = new Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    subSections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSection",
    }],
})

const Section = mongoose.model<IEventSection>("Section",sectionSchema);
export default Section;
