"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceOfParticularEvent = exports.allavailableEvents = exports.eventSummaryOfUser = exports.eventSummary = exports.infiniteEventsWithFilterHomepage = exports.eventDetailsById = exports.markAsActiveInactive = exports.PublishedDraft = exports.editService = exports.createService = exports.editEvent = exports.createEvent = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const event_models_1 = __importDefault(require("../models/event.models"));
const user_models_1 = __importDefault(require("../models/user.models"));
const category_models_1 = __importDefault(require("../models/category.models"));
const section_models_1 = __importDefault(require("../models/section.models"));
const subcategory_models_1 = __importDefault(require("../models/subcategory.models"));
const subsection_models_1 = __importDefault(require("../models/subsection.models"));
const mongoose_1 = __importDefault(require("mongoose"));
const mediaUpload_helper_1 = require("../helper/mediaUpload.helper");
const request_body_validation_1 = require("../zod/request.body.validation");
const service_models_1 = __importDefault(require("../models/service.models"));
const lodash_1 = __importDefault(require("lodash"));
// create event TODO: date/time
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const parseData = request_body_validation_1.createEventBodySchema.safeParse(req.body);
        // validation
        if (!parseData.success) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "validation failed");
        }
        // check image url
        const imageUrl = (_b = req.files) === null || _b === void 0 ? void 0 : _b.imageUrl;
        if (!imageUrl) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "imageUrl not found");
        }
        // check user present
        const isUser = yield user_models_1.default.findOne({ _id: userId });
        if (!isUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // uplaod on cloudinary
        const thumbnailImage = yield (0, mediaUpload_helper_1.thumbnailToCloudinary)(imageUrl, process.env.FOLDER_NAME);
        if (!thumbnailImage) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "upload failed");
        }
        // create event
        const data = yield event_models_1.default.create({
            user: isUser._id,
            availability: parseData.data.availability,
            location: parseData.data.location,
            imageUrl: thumbnailImage.secure_url,
        });
        // update user
        yield user_models_1.default.findByIdAndUpdate({ _id: isUser._id }, {
            $push: {
                events: data._id,
            },
        }, { new: true });
        return (0, apiResponse_helper_1.SuccessResponse)(res, 201, "Event created successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.createEvent = createEvent;
// editEvent
const editEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const updates = __rest(req.body, []);
        console.log("eventId", updates.eventId);
        console.log("updates", updates);
        // validation
        if (!updates.eventId || !userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // Fetch event and user in parallel
        const [isEvent, isUser] = yield Promise.all([
            event_models_1.default.findById(updates.eventId),
            user_models_1.default.findById(userId),
        ]);
        // validation
        if (!isEvent)
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Event not found");
        if (!isUser)
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        // Handle image upload if present
        if ((_b = req.files) === null || _b === void 0 ? void 0 : _b.imageUrl) {
            const imageFile = req.files.imageUrl;
            if (!imageFile) {
                return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid image file");
            }
            console.log("imageFile", imageFile);
            const uploadedImage = yield (0, mediaUpload_helper_1.thumbnailToCloudinary)(imageFile, process.env.FOLDER_NAME);
            if (!uploadedImage) {
                return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Image upload failed");
            }
            isEvent.imageUrl = uploadedImage.secure_url;
        }
        // Update event fields dynamically
        const allowFields = ["availability", "location", "status"];
        const filteredUpdates = lodash_1.default.pick(updates, allowFields);
        Object.assign(isEvent, filteredUpdates);
        // Save event
        const updatedEvent = yield isEvent.save();
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Event edited successfully", updatedEvent);
    }
    catch (error) {
        console.error("Error editing event:", error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.editEvent = editEvent;
// createService
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { eventId, serviceData } = req.body;
        // Validate input
        if (!userId ||
            !eventId ||
            !Array.isArray(serviceData) ||
            serviceData.length === 0) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required and serviceData must be a non-empty array");
        }
        // Validate ObjectIds
        if (!mongoose_1.default.Types.ObjectId.isValid(userId) ||
            !mongoose_1.default.Types.ObjectId.isValid(eventId)) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid userId or eventId");
        }
        // Fetch user and event in parallel
        const [isUser, isEvent] = yield Promise.all([
            user_models_1.default.findById(userId).select("_id"),
            event_models_1.default.findById(eventId).select("_id service"),
        ]);
        if (!isUser || !isEvent) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User or Event not found");
        }
        // Process service data
        const sections = yield Promise.all(serviceData.map((categoryData) => __awaiter(void 0, void 0, void 0, function* () {
            if (!categoryData.id ||
                !mongoose_1.default.Types.ObjectId.isValid(categoryData.id)) {
                throw new Error("Invalid category ID");
            }
            // Fetch category
            const category = yield category_models_1.default.findById(categoryData.id).select("_id");
            if (!category) {
                throw new Error("Category not found");
            }
            // Create section
            const section = yield section_models_1.default.create({ categoryId: category._id });
            // Handle subcategories
            if (Array.isArray(categoryData.subCategories) &&
                categoryData.subCategories.length > 0) {
                const subCategoryIds = categoryData.subCategories
                    .map((sub) => mongoose_1.default.Types.ObjectId.isValid(sub.id)
                    ? new mongoose_1.default.Types.ObjectId(sub.id)
                    : null)
                    .filter((id) => id !== null);
                const validSubCategories = yield subcategory_models_1.default.find({
                    _id: { $in: subCategoryIds },
                }).select("_id");
                if (validSubCategories.length !== subCategoryIds.length) {
                    throw new Error("One or more subcategories are invalid");
                }
                // Create subSections
                const subSections = yield Promise.all(validSubCategories.map((sub) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b;
                    return subsection_models_1.default.create({
                        subCategoryId: sub._id,
                        about: (_a = categoryData.subCategories.find((s) => s.id === sub._id.toString())) === null || _a === void 0 ? void 0 : _a.about,
                        price: (_b = categoryData.subCategories.find((s) => s.id === sub._id.toString())) === null || _b === void 0 ? void 0 : _b.price,
                    });
                })));
                // Update section with subSections
                yield section_models_1.default.findByIdAndUpdate(section._id, {
                    $push: { subSections: { $each: subSections.map((s) => s._id) } },
                });
            }
            return section;
        })));
        // Create service entry
        const service = yield service_models_1.default.create({
            userId: isUser._id,
            eventId: isEvent._id,
            sections: sections.map((section) => section._id),
        });
        // Update event with the new service ID
        yield event_models_1.default.findByIdAndUpdate(isEvent._id, {
            $push: { service: service._id },
        });
        return (0, apiResponse_helper_1.SuccessResponse)(res, 201, "Event service created successfully", {
            service,
        });
    }
    catch (error) {
        console.error("Error in createService:", error.message);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, error.message || "Internal Server Error");
    }
});
exports.createService = createService;
// editService
const editService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { eventId, serviceData } = req.body;
        // Validate input
        if (!userId ||
            !eventId ||
            !Array.isArray(serviceData) ||
            serviceData.length === 0) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required and serviceData must be a non-empty array");
        }
        // Validate ObjectIds
        if (!mongoose_1.default.Types.ObjectId.isValid(userId) ||
            !mongoose_1.default.Types.ObjectId.isValid(eventId)) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid userId or eventId");
        }
        // Fetch user and event in parallel
        const [isUser, isEvent] = yield Promise.all([
            user_models_1.default.findById(userId).select("_id"),
            event_models_1.default.findById(eventId).select("_id service"),
        ]);
        if (!isUser || !isEvent) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User or Event not found");
        }
        // find services
        const service = yield service_models_1.default.findOne({ userId: isUser._id, eventId: isEvent._id });
        // delete sections and subsections
        if ((service === null || service === void 0 ? void 0 : service.sections.length) === 0 || !service) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "No sections found");
        }
        const oldSections = yield section_models_1.default.find({ _id: { $in: service === null || service === void 0 ? void 0 : service.sections } });
        // delete allSubSections
        yield Promise.all(oldSections.map((section) => __awaiter(void 0, void 0, void 0, function* () {
            return yield subsection_models_1.default.deleteMany({ _id: { $in: section.subSections } });
        })));
        // delete sections
        yield section_models_1.default.deleteMany({ _id: { $in: service === null || service === void 0 ? void 0 : service.sections } });
        // process service data
        const sections = yield Promise.all(serviceData.map((categoryData) => __awaiter(void 0, void 0, void 0, function* () {
            // validation
            if (!categoryData.id || !mongoose_1.default.Types.ObjectId.isValid(categoryData.id)) {
                throw new Error("Invalid category ID");
            }
            // fetch category
            const category = yield category_models_1.default.findById(categoryData.id).select("_id");
            if (!category) {
                throw new Error("Category not found");
            }
            // create section
            const section = yield section_models_1.default.create({ categoryId: category._id });
            // handle subcategories
            if (Array.isArray(categoryData.subCategories) &&
                categoryData.subCategories.length > 0) {
                const subCategoryIds = categoryData.subCategories
                    .map((sub) => mongoose_1.default.Types.ObjectId.isValid(sub.id)
                    ? new mongoose_1.default.Types.ObjectId(sub.id)
                    : null)
                    .filter((id) => id !== null);
                const validSubCategories = yield subcategory_models_1.default.find({
                    _id: { $in: subCategoryIds },
                }).select("_id");
                if (validSubCategories.length !== subCategoryIds.length) {
                    throw new Error("One or more subcategories are invalid");
                }
                // create subSections
                const subSections = yield Promise.all(validSubCategories.map((sub) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b;
                    return subsection_models_1.default.create({
                        subCategoryId: sub._id,
                        about: (_a = categoryData.subCategories.find((s) => s.id === sub._id.toString())) === null || _a === void 0 ? void 0 : _a.about,
                        price: (_b = categoryData.subCategories.find((s) => s.id === sub._id.toString())) === null || _b === void 0 ? void 0 : _b.price,
                    });
                })));
                // update section with subSections
                yield section_models_1.default.findByIdAndUpdate(section._id, {
                    $push: { subSections: { $each: subSections.map((s) => s._id) } },
                });
            }
            // return section
            return section;
        })));
        // update services
        service.sections = sections.map((section) => section._id);
        yield service.save();
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Service edited successfully", true);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server");
    }
});
exports.editService = editService;
// published/draft
const PublishedDraft = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { eventId, status } = req.body;
        // validation
        if (!eventId || !status || !userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check is event exists
        const [isEvent, isUser] = yield Promise.all([
            event_models_1.default.findById(eventId),
            user_models_1.default.findById(userId),
        ]);
        if (!isEvent || !isUser) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Event/User not found");
        }
        // update event
        const data = yield event_models_1.default.findByIdAndUpdate({ _id: isEvent._id }, {
            $set: {
                status: status,
            },
        }, { new: true });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "SubSection published/drafted successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.PublishedDraft = PublishedDraft;
// mark as active and inactive
const markAsActiveInactive = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { eventId, mark } = req.body;
        // validation
        if (!eventId || !userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check is event exists
        const [isEvent, isUser] = yield Promise.all([
            event_models_1.default.findById(eventId),
            user_models_1.default.findById(userId),
        ]);
        if (!isEvent || !isUser) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Event/User not found");
        }
        // update event
        const data = yield event_models_1.default.findByIdAndUpdate({ _id: isEvent._id }, {
            $set: {
                isActive: mark,
            },
        }, { new: true });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Event active/inactive successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.markAsActiveInactive = markAsActiveInactive;
// eventOfParticularUser -> eventDetails
const eventDetailsById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { eventId } = req.body;
        // validation
        if (!eventId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // data
        const data = yield event_models_1.default.findOne({ _id: eventId })
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
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Events of this user fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.eventDetailsById = eventDetailsById;
// infiniteEventsWithFilter
const infiniteEventsWithFilterHomepage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract pagination and filters
        const { limit, cursor, filters } = req.body;
        const parsedLimit = Number(limit);
        if (!parsedLimit || parsedLimit < 1) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid pagination limit");
        }
        // Build the match query
        const matchQuery = {};
        if (cursor) {
            if (mongoose_1.default.isValidObjectId(cursor)) {
                matchQuery._id = { $lt: new mongoose_1.default.Types.ObjectId(cursor) };
            }
            else {
                return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid cursor");
            }
        }
        if (filters) {
            if (filters.location) {
                matchQuery.location = filters.location;
            }
            ;
            if (filters.isActive) {
                matchQuery.isActive = filters.isActive;
            }
        }
        console.log("filters", filters);
        console.log("matchQuery", matchQuery);
        // Aggregation pipeline
        const pipeline = [
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
                $match: Object.assign({}, (filters.username && {
                    "userData.username": { $regex: filters.username, $options: "i" }
                }))
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
        const events = yield event_models_1.default.aggregate(pipeline);
        // Pagination response
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Events fetched successfully", {
            pagination: {
                hasMore: events.length === parsedLimit,
                nextCursor: events.length > 0 ? events[events.length - 1]._id : null,
            },
            data: events,
        });
    }
    catch (error) {
        console.error("Error fetching events:", error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.infiniteEventsWithFilterHomepage = infiniteEventsWithFilterHomepage;
// eventSummary
const eventSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { eventId } = req.body;
        if (!eventId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // Aggregation pipeline
        const pipeline = [
            { $match: { _id: new mongoose_1.default.Types.ObjectId(eventId) } }, // Stage 1: Filter data
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
        const events = yield event_models_1.default.aggregate(pipeline);
        // Pagination response
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Events fetched successfully", {
            data: events,
        });
    }
    catch (error) {
        console.error("Error fetching events:", error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.eventSummary = eventSummary;
// eventSummaryOfPartcularUser
const eventSummaryOfUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // Aggregation pipeline
        const pipeline = [
            { $match: { user: new mongoose_1.default.Types.ObjectId(userId) } }, // Stage 1: Filter data
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
        const events = yield event_models_1.default.aggregate(pipeline);
        // Pagination response
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Events fetched successfully", {
            data: events,
        });
    }
    catch (error) {
        console.error("Error fetching events:", error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.eventSummaryOfUser = eventSummaryOfUser;
// allavailableEvents
const allavailableEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield event_models_1.default.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(25)
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
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Events fetched successfully", events);
    }
    catch (error) {
        console.error("Error fetching events:", error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.allavailableEvents = allavailableEvents;
// serviceOfParticularEvent
const serviceOfParticularEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { eventId } = req.body;
        if (!eventId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // validation
        if (!mongoose_1.default.isValidObjectId(eventId)) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Invalid eventId");
        }
        // data
        const data = yield event_models_1.default.findOne({ _id: eventId }).select("_id")
            .populate({
            path: "service",
            populate: {
                path: "sections",
                populate: [
                    {
                        path: "categoryId",
                        select: "_id",
                    },
                    {
                        path: "subSections",
                        populate: {
                            path: "subCategoryId",
                            select: "_id",
                        },
                    },
                ],
            },
        });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Service of this event fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.serviceOfParticularEvent = serviceOfParticularEvent;
