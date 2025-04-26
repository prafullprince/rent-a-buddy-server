import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import Event from "../models/event.models";
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
import _ from "lodash";

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

// editEvent
export const editEvent = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { ...updates } = req.body;
    console.log("eventId", updates.eventId);
    console.log("updates", updates);
    // validation
    if (!updates.eventId || !userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // Fetch event and user in parallel
    const [isEvent, isUser] = await Promise.all([
      Event.findById(updates.eventId),
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
      console.log("imageFile", imageFile);
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

// createService
export const createService = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { eventId, serviceData } = req.body;

    // Validate input
    if (
      !userId ||
      !eventId ||
      !Array.isArray(serviceData) ||
      serviceData.length === 0
    ) {
      return ErrorResponse(
        res,
        400,
        "All fields are required and serviceData must be a non-empty array"
      );
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
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
        if (
          !categoryData.id ||
          !mongoose.Types.ObjectId.isValid(categoryData.id)
        ) {
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
        if (
          Array.isArray(categoryData.subCategories) &&
          categoryData.subCategories.length > 0
        ) {
          const subCategoryIds = categoryData.subCategories
            .map((sub: any) =>
              mongoose.Types.ObjectId.isValid(sub.id)
                ? new mongoose.Types.ObjectId(sub.id)
                : null
            )
            .filter((id: any) => id !== null);

          const validSubCategories = await SubCategory.find({
            _id: { $in: subCategoryIds },
          }).select("_id");

          if (validSubCategories.length !== subCategoryIds.length) {
            throw new Error("One or more subcategories are invalid");
          }

          // Create subSections
          const subSections = await Promise.all(
            validSubCategories.map(async (sub: any) => {
              return SubSection.create({
                subCategoryId: sub._id,
                about: categoryData.subCategories.find(
                  (s: any) => s.id === sub._id.toString()
                )?.about,
                price: categoryData.subCategories.find(
                  (s: any) => s.id === sub._id.toString()
                )?.price,
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
    await Event.findByIdAndUpdate(isEvent._id, {
      $push: { service: service._id },
    });

    return SuccessResponse(res, 201, "Event service created successfully", {
      service,
    });
  } catch (error: any) {
    console.error("Error in createService:", error.message);
    return ErrorResponse(res, 500, error.message || "Internal Server Error");
  }
};

// editService


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
export const markAsActiveInactive = async (req: Request, res: Response): Promise<any> => {
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


// eventOfParticularUser -> eventDetails
export const eventDetailsById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { eventId } = req.body;

    // validation
    if (!eventId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // data
    const data = await Event.findOne({ _id: eventId })
      .populate({
        path: "user",
        select: "_id username",
      })
      .populate({
        path: "service",
        populate: {
          path: "sections",
          populate: [
            {
              path: "categoryId",
              select: "_id name",
            },
            {
              path: "subSections",
              populate: {
                path: "subCategoryId",
                select: "_id name imageUrl about",
              },
            },
          ],
        },
      });

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
    const { limit, cursor, filters } = req.body;
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
    if (filters) {
      if (filters.location) {
        matchQuery.location = filters.location;
      };
      if (filters.isActive) {
        matchQuery.isActive = filters.isActive;
      }
      
    }

    console.log("filters", filters);
    console.log("matchQuery", matchQuery);

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

      {
        $match: {
          ...(filters.username && {
            "userData.username": { $regex: filters.username, $options: "i" }
          }),
          // ...(filters.gender && {
          //   "userData.gender": filters.gender
          // }),
          // ...(filters.rating && {
          //   "userData.rating": filters.rating
          // }),
        }
      },

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
      {
        $project: {
          _id: 1,
          availability: 1,
          location: 1,
          createdAt: 1,
          imageUrl: 1,
          "userData.username": 1,
          "subSectionsData.price": 1,
          "subCategoryData.imageUrl": 1,
          "subCategoryData.name": 1,
          isActive: 1,
        },
      },
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

// eventSummary
export const eventSummary = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { eventId } = req.body;

    if (!eventId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // Aggregation pipeline
    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(eventId) } }, // Stage 1: Filter data

      // { $sort: { createdAt: -1 } }, // Stage 2: Sort by createdAt (descending)

      // { $addFields: { originalId: "$_id" } }, // Preserve _id before lookups

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
      // {
      //   $setWindowFields: {
      //     partitionBy: null,
      //     sortBy: { originalId: -1 },
      //     output: {},
      //   },
      // },

      // Stage 9: Projection (select only necessary fields)
      {
        $project: {
          _id: 1,
          availability: 1,
          location: 1,
          createdAt: 1,
          imageUrl: 1,
          "userData.username": 1,
          "subSectionsData.price": 1,
          "subCategoryData.imageUrl": 1,
          "subCategoryData.name": 1,
          isActive: 1,
        },
      },
    ];

    // Execute aggregation
    const events = await Event.aggregate(pipeline);

    // Pagination response
    return SuccessResponse(res, 200, "Events fetched successfully", {
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// eventSummaryOfPartcularUser
export const eventSummaryOfUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // Aggregation pipeline
    const pipeline: any[] = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } }, // Stage 1: Filter data

      { $sort: { createdAt: -1 } },

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

      { $limit: 1 },

      // Stage 9: Projection (select only necessary fields)
      {
        $project: {
          _id: 1,
          availability: 1,
          location: 1,
          createdAt: 1,
          imageUrl: 1,
          "userData.username": 1,
          "subSectionsData.price": 1,
          "subCategoryData.imageUrl": 1,
          "subCategoryData.name": 1,
          isActive: 1,
        },
      },
    ];

    // Execute aggregation
    const events = await Event.aggregate(pipeline);

    // Pagination response
    return SuccessResponse(res, 200, "Events fetched successfully", {
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// allavailableEvents
export const allavailableEvents = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const events = await Event.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate([
        { path: "user", select: "_id username" },
        {
          path: "service",
          populate: {
            path: "sections",
            populate: [
              { path: "categoryId", select: "_id name" },
              { path: "subSections", populate: "_id price" },
            ],
          },
        },
      ]);

    // Pagination response
    return SuccessResponse(res, 200, "Events fetched successfully", events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
