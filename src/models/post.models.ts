// import
import mongoose, { Schema } from "mongoose";



// schema
const postSchema:Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    imageUrl: {
        type: String,
    },
},{timestamps: true});


// export
const Post = mongoose.model<any>("Post",postSchema);
export default Post;
