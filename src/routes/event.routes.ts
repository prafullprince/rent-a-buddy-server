// import express and make router instances
import express from 'express';
import { auth, isBuddy } from '../middleware/auth.middleware';
import { allavailableEvents, createEvent, createService, editEvent, eventDetailsById, eventSummary, eventSummaryOfUser, infiniteEventsWithFilterHomepage, PublishedDraft } from '../controllers/event.controllers';

// router instances
const router = express.Router();

// import controllers


// routes
router.post('/createEvent', auth, isBuddy, createEvent);
router.post('/published', auth, isBuddy, PublishedDraft);
router.post('/createService', auth, isBuddy, createService);
router.post('/infinteEventsWithFilter', infiniteEventsWithFilterHomepage);
router.post('/getEventSummary', auth, isBuddy, eventSummary);
router.get('/getEventSummaryOfUser', auth, isBuddy, eventSummaryOfUser);
router.post('/editEvent', auth, isBuddy, editEvent);
router.post('/getEventById', eventDetailsById);
router.get('/availableEvents', allavailableEvents);

// export router
export default router;
