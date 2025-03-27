// import express and make router instances
import express from 'express';
import { auth, isBuddy } from '../middleware/auth.middleware';
import { createEvent, createService, infiniteEventsWithFilterHomepage, PublishedDraft } from '../controllers/event.controllers';

// router instances
const router = express.Router();

// import controllers


// routes
router.post('/createEvent', auth, isBuddy, createEvent);
// router.post('/createSection', auth, isBuddy, createSection);
// router.post('/createSubSection', auth, isBuddy, createSubSection);
router.post('/published', auth, isBuddy, PublishedDraft);
router.post('/createService', auth, isBuddy, createService);
router.post('/infinteEventsWithFilter', infiniteEventsWithFilterHomepage);

// export router
export default router;
