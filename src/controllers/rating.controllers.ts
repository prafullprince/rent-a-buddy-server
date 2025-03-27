import { SuccessResponse } from "../helper/apiResponse.helper";
import Rating from "../models/rating.models";
import User from "../models/user.models";

// createRating
export const createRating = async (req: any, res: any) => {
    try {

        // fetch data
        const userId = req.user?.id;
        const { user, rating, review } = req.body;

        // check isUser already rated by this user
        const isUser = await User.findOne({ _id: user });
        if (isUser?.ratingAndReviews?.find((ratingAndReview:any) => ratingAndReview.user === userId)) {
            return res.status(409).json({ message: "User already rated by this user" });
        }

        // if not then save in db
        const data = await Rating.create({
            user: userId,
            rating: rating,
            review: review,
        });

        // update user
        const updatedUser = await User.findByIdAndUpdate(
            {_id: userId},
            {
                $push:{
                    ratingAndReviews: data._id
                }
            },
            {new:true}
        );
        
        return SuccessResponse(res,201,"Ratings created",data);

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

