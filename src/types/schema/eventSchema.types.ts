import mongoose from "mongoose";

export interface IEvent {
    user: mongoose.Types.ObjectId;
    availability: string;
    location: string;
    sections: mongoose.Types.ObjectId[];
}


export interface IEventSection {
    name: mongoose.Types.ObjectId;
    event: mongoose.Types.ObjectId;
    subSections: mongoose.Types.ObjectId[];
}


export interface IEventSubSection {
    name: mongoose.Types.ObjectId;
    price: number;
    section: mongoose.Types.ObjectId;
    about: mongoose.Types.ObjectId;
}
