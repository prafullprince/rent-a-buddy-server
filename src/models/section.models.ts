import mongoose, { Schema } from "mongoose";

// interface
export interface IEventSection {
    categoryId: mongoose.Types.ObjectId;
    subSections: mongoose.Types.ObjectId[];
}


const sectionSchema = new Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    subSections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSection",
    }],
})

// createIndex
sectionSchema.index({ _id: 1, subSections: 1 }); 

const Section = mongoose.model<IEventSection>("Section",sectionSchema);
export default Section;
