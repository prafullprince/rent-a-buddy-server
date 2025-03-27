import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import Event from '../models/event.models';
import User from "../models/user.models";
import Category from "../models/category.models";
import Section from "../models/section.models";
import SubCategory from "../models/subcategory.models";
import SubSection from "../models/subsection.models";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import { thumbnailToCloudinary } from "../helper/mediaUpload.helper";
import { createEventBodySchema } from "../zod/request.body.validation";
import Service from "../models/service.models";
import _ from 'lodash';

// create event TODO: date/time
export const createEvent = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const parseData = createEventBodySchema.safeParse(req.body);

    // validation
    if (!parseData.success) {
      return ErrorResponse(res, 400, "validation failed");
    }

    // check image url
    const imageUrl = req.files?.imageUrl as fileUpload.UploadedFile;

    if (!imageUrl) {
      return ErrorResponse(res, 400, "imageUrl not found");
    }

    // check user present
    const isUser = await User.findOne({ _id: userId });
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // uplaod on cloudinary
    const thumbnailImage = await thumbnailToCloudinary(
      imageUrl,
      process.env.FOLDER_NAME
    );

    if (!thumbnailImage) {
      return ErrorResponse(res, 404, "upload failed");
    }

    // create event
    const data = await Event.create({
      user: isUser._id,
      availability: parseData.data.availability,
      location: parseData.data.location,
      imageUrl: thumbnailImage.secure_url,
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

// createService
export const createService = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { eventId, serviceData } = req.body;
    console.log("serviceData is:", serviceData);
    console.log("req.body", req.body);

    // Validate input
    if (!userId || !eventId || !Array.isArray(serviceData) || serviceData.length === 0) {
      return ErrorResponse(res, 400, "All fields are required and serviceData must be a non-empty array");
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return ErrorResponse(res, 400, "Invalid userId or eventId");
    }

    // Fetch user and event in parallel
    const [isUser, isEvent] = await Promise.all([
      User.findById(userId).select("_id"),
      Event.findById(eventId).select("_id service"),
    ]);

    if (!isUser || !isEvent) {
      return ErrorResponse(res, 404, "User or Event not found");
    }

    // Process service data
    const sections = await Promise.all(
      serviceData.map(async (categoryData: any) => {
        if (!categoryData.id || !mongoose.Types.ObjectId.isValid(categoryData.id)) {
          throw new Error("Invalid category ID");
        }

        // Fetch category
        const category = await Category.findById(categoryData.id).select("_id");
        if (!category) {
          throw new Error("Category not found");
        }

        // Create section
        const section = await Section.create({ categoryId: category._id });

        // Handle subcategories
        if (Array.isArray(categoryData.subCategories) && categoryData.subCategories.length > 0) {
          const subCategoryIds = categoryData.subCategories
            .map((sub: any) => (mongoose.Types.ObjectId.isValid(sub.id) ? new mongoose.Types.ObjectId(sub.id) : null))
            .filter((id: any) => id !== null);

          const validSubCategories = await SubCategory.find({ _id: { $in: subCategoryIds } }).select("_id");

          if (validSubCategories.length !== subCategoryIds.length) {
            throw new Error("One or more subcategories are invalid");
          }

          // Create subSections
          const subSections = await Promise.all(
            validSubCategories.map(async (sub: any) => {
              return SubSection.create({
                subCategoryId: sub._id,
                about: categoryData.subCategories.find((s: any) => s.id === sub._id.toString())?.about,
                price: categoryData.subCategories.find((s: any) => s.id === sub._id.toString())?.price,
              });
            })
          );

          // Update section with subSections
          await Section.findByIdAndUpdate(section._id, {
            $push: { subSections: { $each: subSections.map((s) => s._id) } },
          });
        }

        return section;
      })
    );

    // Create service entry
    const service = await Service.create({
      userId: isUser._id,
      eventId: isEvent._id,
      sections: sections.map((section) => section._id),
    });

    // Update event with the new service ID
    await Event.findByIdAndUpdate(isEvent._id, { $push: { service: service._id } });

    return SuccessResponse(res, 201, "Event service created successfully", { service });

  } catch (error: any) {
    console.error("Error in createService:", error.message);
    return ErrorResponse(res, 500, error.message || "Internal Server Error");
  }
};

// published/draft
export const PublishedDraft = async (
  req: Request,
  res: Response
): Promise<any> => {
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
    const userId = req.user?.id;
    const { eventId, ...updates } = req.body;

    // validation
    if (!eventId || !userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // Fetch event and user in parallel
    const [isEvent, isUser] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId),
    ]);

    // validation
    if (!isEvent) return ErrorResponse(res, 404, "Event not found");
    if (!isUser) return ErrorResponse(res, 404, "User not found");

    // Handle image upload if present
    if (req.files?.imageUrl) {
      const imageFile = req.files.imageUrl as fileUpload.UploadedFile;
      if (!imageFile) {
        return ErrorResponse(res, 400, "Invalid image file");
      }

      const uploadedImage = await thumbnailToCloudinary(
        imageFile,
        process.env.FOLDER_NAME!
      );

      if (!uploadedImage) {
        return ErrorResponse(res, 500, "Image upload failed");
      }

      isEvent.imageUrl = uploadedImage.secure_url;
    }

    // Update event fields dynamically
    const allowFields = ["availability", "location", "status"];
    const filteredUpdates = _.pick(updates, allowFields);
    Object.assign(isEvent, filteredUpdates);

    // Save event
    const updatedEvent = await isEvent.save();

    return SuccessResponse(res, 200, "Event edited successfully", updatedEvent);
  } catch (error) {
    console.error("Error editing event:", error);
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
          as: "userData",
        },
      },
      { $unwind: "userData" },

      // stage 2 -> join user + rating
      {
        $lookup: {
          from: "ratings",
          localField: "userData.ratingAndReviews",
          foreignField: "_id",
          as: "userData.ratingData",
        },
      },

      // stage 3 -> calculate avg rating
      {
        $addFields: {
          avgRating: { $avg: "$userData.ratingData.rating" },
        },
      },

      // stage 4 -> categories
      {
        $lookup: {
          from: "sections",
          localField: "sections",
          foreignField: "_id",
          as: "sectionData",
        },
      },

      // stage 5 -> sub-categories
      {
        $lookup: {
          from: "subSections",
          localField: "sectionData.subSections",
          foreignField: "_id",
          as: "subSectionData",
        },
      },

      // match
      {
        $match: {
          _id: eventId,
        },
      },

      // $project
    ]);

    // return res
    return SuccessResponse(
      res,
      200,
      "Events of this user fetched successfully",
      data
    );
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// infiniteEventsWithFilter
export const infiniteEventsWithFilterHomepage = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Extract pagination and filters
    const { limit, cursor, ...filters } = req.body;
    const parsedLimit = Number(limit);

    if (!parsedLimit || parsedLimit < 1) {
      return ErrorResponse(res, 400, "Invalid pagination limit");
    }

    // Build the match query
    const matchQuery: any = {};

    if (cursor) {
      if (mongoose.isValidObjectId(cursor)) {
        matchQuery._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      } else {
        return ErrorResponse(res, 400, "Invalid cursor");
      }
    }
    console.log("query",matchQuery);
    if (filters) {
      if (filters.isActive !== undefined) matchQuery.isActive = filters.isActive;
      if (filters.location) matchQuery.location = filters.location;
    }

    // Aggregation pipeline
    const pipeline: any[] = [
      { $match: matchQuery }, // Stage 1: Filter data

      { $sort: { createdAt: -1 } }, // Stage 2: Sort by createdAt (descending)

      { $addFields: { originalId: "$_id" } }, // Preserve _id before lookups

      // Stage 4: Lookup user data
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },

      // Stage 5: Lookup service data
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "serviceData",
        },
      },
      { $unwind: { path: "$serviceData", preserveNullAndEmptyArrays: true } },

      // Stage 6: Lookup sections
      {
        $lookup: {
          from: "sections",
          localField: "serviceData.sections",
          foreignField: "_id",
          as: "sectionsData",
        },
      },

      // Stage 7: Lookup subsections
      {
        $lookup: {
          from: "subsections",
          localField: "sectionsData.subSections",
          foreignField: "_id",
          as: "subSectionsData",
        },
      },

      // Stage 8: Lookup subcategories
      {
        $lookup: {
          from: "subcategories",
          localField: "subSectionsData.subCategoryId",
          foreignField: "_id",
          as: "subCategoryData",
        },
      },

      // 🔥 Final Sorting to Maintain Order After Lookups
      {
        $setWindowFields: {
          partitionBy: null,
          sortBy: { originalId: -1 },
          output: {},
        },
      },

      { $limit: parsedLimit }, // Stage 3: Apply limit

      // Stage 9: Projection (select only necessary fields)
      // {
      //   $project: {
      //     _id: 1,
      //     availability: 1,
      //     location: 1,
      //     createdAt: 1,
      //     "userData.username": 1,
      //     "sectionsData.name": 1,
      //     "subSectionsData.name": 1,
      //     "subCategoryData.name": 1,
      //     "subCategoryData.imageUrl": 1,
      //   },
      // },
    ];

    // Execute aggregation
    const events = await Event.aggregate(pipeline);

    // Pagination response
    return SuccessResponse(res, 200, "Events fetched successfully", {
      pagination: {
        hasMore: events.length === parsedLimit,
        nextCursor: events.length > 0 ? events[events.length - 1]._id : null,
      },
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
