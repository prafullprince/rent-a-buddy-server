import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import Event from "../models/event.models";
import User from "../models/user.models";
import Category from "../models/category.models";
import Section from "../models/section.models";
import SubCategory from "../models/subcategory.models";
import SubSection from "../models/subsection.models";
import mongoose from "mongoose";

// create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { availability, location } = req.body;

    // validation
    if (!availability || !location) {
      return ErrorResponse(res, 400, "credentials not found");
    }

    // check user present
    const isUser = await User.findOne({ _id: userId });
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // create event
    const data = await Event.create({
      user: isUser._id,
      availability,
      location,
    });

    // update user
    await User.findByIdAndUpdate(
      { _id: isUser._id },
      {
        $push: {
          events: data._id,
        },
      },
      { new: true }
    );

    return SuccessResponse(res, 201, "Event created successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal Server Error");
  }
};

// createSection
export const createSection = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { name, eventId } = req.body;

    // validation
    if (!name || !eventId) {
      return ErrorResponse(res, 400, "credentials not found");
    }

    // check user,event,category present
    const [isUser, isEvent, isCategory] = await Promise.all([
      User.findOne({ _id: userId }),
      Event.findOne({ _id: eventId }),
      Category.findOne({ name: name }),
    ]);

    // validation
    if (!isUser || !isEvent || !isCategory) {
      return res.status(404).json({ message: "user/category/event not found" });
    }

    // create section
    const data = await Section.create({
      name: isCategory._id,
      event: isEvent._id,
    });

    // update event
    await Event.findByIdAndUpdate(
      { _id: isEvent._id },
      {
        $push: {
          sections: data._id,
        },
      },
      { new: true }
    );

    return SuccessResponse(res, 201, "section created successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal Server Error");
  }
};

// createSubSection
export const createSubSection = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { name, price, sectionId, about, eventId } = req.body;

    // validation
    if (!name || !price || !sectionId || !about || !eventId) {
      return ErrorResponse(res, 400, "credentials not found");
    }

    // check user,event,category,section present
    const [isUser, isSubCategory, isSection, isEvent] = await Promise.all([
      User.findOne({ _id: userId }),
      SubCategory.findOne({ name: name }),
      Section.findOne({ _id: sectionId }),
      Event.findOne({ _id: eventId }),
    ]);

    // validation
    if (!isUser || !isSubCategory || !isSection || !isEvent) {
      return res.status(404).json({ message: "user/category/event not found" });
    }

    // create sub-sections
    const data = await SubSection.create({
      name: isSubCategory._id,
      price: price,
      section: isSection._id,
      about: about,
    });

    // update section and sub-category
    await Promise.all([
      Section.findByIdAndUpdate(
        { _id: isSection._id },
        {
          $push: {
            subSections: data._id,
          },
        },
        { new: true }
      ),
      SubCategory.findByIdAndUpdate(
        { _id: isSubCategory._id },
        {
          $push: {
            events: isEvent._id,
          },
        },
        { new: true }
      ),
    ]);

    return SuccessResponse(res, 201, "sub-section created successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal Server Error");
  }
};

// published/draft
export const PublishedDraft = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { eventId, status } = req.body;

    // validation
    if (!eventId || !status || !userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check is event exists
    const [isEvent, isUser] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!isEvent || !isUser) {
      return ErrorResponse(res, 404, "Event/User not found");
    }

    // update event
    const data = await Event.findByIdAndUpdate(
      { _id: isEvent._id },
      {
        $set: {
          status: status,
        },
      },
      { new: true }
    );

    // return res
    return SuccessResponse(
      res,
      200,
      "SubSection published/drafted successfully",
      data
    );
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal Server Error");
  }
};

// mark as active and inactive
export const markAsActiveInactive = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { eventId, mark } = req.body;

    // validation
    if (!eventId || !userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check is event exists
    const [isEvent, isUser] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    if (!isEvent || !isUser) {
      return ErrorResponse(res, 404, "Event/User not found");
    }

    // update event
    const data = await Event.findByIdAndUpdate(
      { _id: isEvent._id },
      {
        $set: {
          isActive: mark,
        },
      },
      { new: true }
    );

    // return res
    return SuccessResponse(
      res,
      200,
      "Event active/inactive successfully",
      data
    );
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal Server Error");
  }
};

// editEvent
export const editEvent = async (req: Request, res: Response) => {
  try {
    // fetch data
    const updates = req.body;
    const eventId = req.body.eventId;

    // validation
    if (!eventId) {
      return ErrorResponse(res, 400, "all fields are required");
    }

    // check if event/user exists
    const isEvent: any = await Event.findById(eventId);
    if (!isEvent) {
      return ErrorResponse(res, 404, "Event not found");
    }

    // updates field which is present
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        isEvent[key] = updates[key];
      }
    }

    const data = await isEvent.save();

    // return res
    return SuccessResponse(res, 200, "Event edited successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// editSection
export const editSection = async (req: Request, res: Response) => {
  try {
    // fetch data
    const { name, sectionId } = req.body;

    // validation
    if (!name || !sectionId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check is category/section exist
    const [isCategory, isSection] = await Promise.all([
      Category.findOne({ name: name }),
      Section.findOne({ _id: sectionId }),
    ]);

    // validation
    if (!isCategory || !isSection) {
      return ErrorResponse(res, 404, "All fields are required");
    }

    // update
    isSection.name = isCategory._id;
    const data = await isSection.save();

    // return res
    return SuccessResponse(res, 200, "Section edited successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// editSubSection
export const editSubSection = async (req: Request, res: Response) => {
  try {
    // fetch data
    const { name, about, price, subSectionId } = req.body;

    // validation
    if (!subSectionId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check is category exist
    const [isSubCategory, isSubSection] = await Promise.all([
      SubCategory.findOne({ name: name }),
      SubSection.findOne({ _id: subSectionId }),
    ]);

    // validation
    if (!isSubCategory || !isSubSection) {
      return ErrorResponse(res, 404, "All fields are required");
    }

    // update
    if (name) {
      isSubSection.name = isSubCategory._id;
    }
    if (about) {
      isSubSection.about = about;
    }
    if (price) {
      isSubSection.price = price;
    }
    const data = await isSubSection.save();

    // return res
    return SuccessResponse(res, 200, "Subsection edited successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// infiniteEvent with filter -> Homepage card
export const infiniteEventsWithFilter = async (req: Request, res: Response) => {
  try {
    // fetch data
    const { limit = 10, cursor, filters } = req.body;
    const limitNumber = parseInt(limit as string, 10);

    // validation
    if (isNaN(limitNumber) || limitNumber < 1 || !filters) {
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    // make query
    const query: any = {};

    // make cursor
    if (cursor) {
      if (mongoose.isValidObjectId(cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      } else {
        return ErrorResponse(res, 400, "Invalid cursor");
      }
    }

    // apply filters
    if (filters.isActive) {
      query.isActive = filters.isActive;
    }
    if (filters.username) {
      query["userData.username"] = filters.username;
    }
    if (filters.location) {
      query.location = filters.location;
    }

    // pipeline
    const data = await Event.aggregate([
      // stage 1 -> join event -> user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",  // output field name
        },
      },
      { $unwind: "$userData" }, // convert userData from array into object

      // stage 2 -> join user -> ratingAndReviews
      {
        $lookup: {
          from: "ratings",
          localField: "userData.ratingAndReviews",
          foreignField: "_id",
          as: "ratingAndReviewsData",
        },
      },

      // calculate highest rating
      {
        $addFields: {
          highestRating: { $max: "$ratingAndReviewsData.rating" }
        }
      },

      // match filters
      {
        $match: query
      },

      // sort
      {
        $sort: {
          highestRating: -1,
          createdAt: -1
        }
      },

      // limit
      {
        $limit: limitNumber
      }

      // project to select which fields are needed
    ]);

    // nextCursor and hasmore
    const hasmore = data.length === limitNumber;
    const nextCursor = data.length > 0 ? data[data.length-1]._id : null;

    // return res
    return SuccessResponse(res, 200, "Events fetched successfully", {
      pagination: {
        hasmore,
        nextCursor,
        data
      }
    });

  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// eventOfParticularUser -> eventDetails
export const eventOfParticularUser = async (req: Request, res: Response) => {
  try {
    // fetch data
    const { eventId } = req.body;

    // validation
    if (!eventId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check if event exist
    const isEvent = await Event.findOne({ _id: eventId });

    // validation
    if (!isEvent) {
      return ErrorResponse(res, 404, "Event not found");
    }

    // pipeline to getAllDetails of particular event
    const data = await Event.aggregate([
      // stage 1 -> join event + user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData"
        }
      },
      {$unwind: "userData"},

      // stage 2 -> join user + rating
      {
        $lookup: {
          from: "ratings",
          localField: "userData.ratingAndReviews",
          foreignField: "_id",
          as: "userData.ratingData"
        }
      },

      // stage 3 -> calculate avg rating
      {
        $addFields: {
          avgRating: { $avg: "$userData.ratingData.rating" },
        }
      },

      // stage 4 -> categories
      {
        $lookup: {
          from: "sections",
          localField: "sections",
          foreignField: "_id",
          as: "sectionData" 
        }
      },

      // stage 5 -> sub-categories
      {
        $lookup: {
          from: "subSections",
          localField: "sectionData.subSections",
          foreignField: "_id",
          as: "subSectionData"
        }
      },

      // match
      {
        $match: {
          _id: eventId
        }
      }

      // $project
    ]);

    // return res
    return SuccessResponse(res, 200, "Events of this user fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
