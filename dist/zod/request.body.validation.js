"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsActiveInactiveBodySchema = exports.editSubSectionBodySchema = exports.editSectionBodySchema = exports.editEventBodySchema = exports.createSubSectionBodySchema = exports.createSectionBodySchema = exports.createServiceBodySchema = exports.createEventBodySchema = exports.authenticateBodySchema = void 0;
const zod_1 = require("zod");
// authenticate
exports.authenticateBodySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// createEvent
exports.createEventBodySchema = zod_1.z.object({
    availability: zod_1.z.string(),
    location: zod_1.z.string(),
});
// createService
exports.createServiceBodySchema = zod_1.z.object({});
// createSection
exports.createSectionBodySchema = zod_1.z.object({
    name: zod_1.z.string(),
    eventId: zod_1.z.string(),
});
// createSubSection
exports.createSubSectionBodySchema = zod_1.z.object({
    name: zod_1.z.string(),
    price: zod_1.z.string(),
    sectionId: zod_1.z.string(),
    about: zod_1.z.string(),
    eventId: zod_1.z.string(),
});
// editEvent
exports.editEventBodySchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    availability: zod_1.z.string(),
    location: zod_1.z.string(),
});
// editSection
exports.editSectionBodySchema = zod_1.z.object({
    name: zod_1.z.string(),
    sectionId: zod_1.z.string(),
});
// editSubSection
exports.editSubSectionBodySchema = zod_1.z.object({
    name: zod_1.z.string(),
    about: zod_1.z.string(),
    price: zod_1.z.string(),
    subSectionId: zod_1.z.string(),
});
// markAsActiveInactive
exports.markAsActiveInactiveBodySchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    mark: zod_1.z.boolean(),
});
