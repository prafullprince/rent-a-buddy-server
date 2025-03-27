import { z } from "zod";


// authenticate
export const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// createEvent
export const createEventBodySchema = z.object({
  availability: z.string(),
  location: z.string(),
});

// createService
export const createServiceBodySchema = z.object({
  
});

// createSection
export const createSectionBodySchema = z.object({
  name: z.string(),
  eventId: z.string(),
});

// createSubSection
export const createSubSectionBodySchema = z.object({
  name: z.string(),
  price: z.string(),
  sectionId: z.string(),
  about: z.string(),
  eventId: z.string(),
});

// editEvent
export const editEventBodySchema = z.object({
  eventId: z.string(),
  availability: z.string(),
  location: z.string(),
});

// editSection
export const editSectionBodySchema = z.object({
  name: z.string(),
  sectionId: z.string(),
});

// editSubSection
export const editSubSectionBodySchema = z.object({
  name: z.string(),
  about: z.string(),
  price: z.string(),
  subSectionId: z.string(),
});

// markAsActiveInactive
export const markAsActiveInactiveBodySchema = z.object({
  eventId: z.string(),
  mark: z.boolean(),
});