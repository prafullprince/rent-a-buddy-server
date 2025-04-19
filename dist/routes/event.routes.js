"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express and make router instances
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const event_controllers_1 = require("../controllers/event.controllers");
// router instances
const router = express_1.default.Router();
// import controllers
// routes
router.post('/createEvent', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.createEvent);
router.post('/published', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.PublishedDraft);
router.post('/createService', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.createService);
router.post('/infinteEventsWithFilter', event_controllers_1.infiniteEventsWithFilterHomepage);
router.post('/getEventSummary', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.eventSummary);
router.get('/getEventSummaryOfUser', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.eventSummaryOfUser);
router.post('/editEvent', auth_middleware_1.auth, auth_middleware_1.isBuddy, event_controllers_1.editEvent);
router.post('/getEventById', event_controllers_1.eventDetailsById);
router.get('/availableEvents', event_controllers_1.allavailableEvents);
// export router
exports.default = router;
