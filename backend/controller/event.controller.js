import {
    handleDeleteEvent,
    saveNewEventAndNotify,
    sendFeedback,
} from "../service/event.service.js";
import db from "../model/index.js";

export const eventViewer = async (req, res, next) => {
    try {
        const event = await db.Event.findAll();
        res.json({
            status: "success",
            message: "Event Viewer",
            event: event,
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    const model = {
        UserModel: db.User,
        EventModel: db.Event,
        NotificationModel: db.Notification,
    };

    try {
        await saveNewEventAndNotify(req.user.id, req.body, req.file, model);

        res.status(200).json({
            status: "success",
            message: "Event Successly Created",
        });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        await handleDeleteEvent(req.params.id, db.Event);

        res.status(200).json({
            status: "success",
            message: "Event Successly Deleted",
        });
    } catch (error) {
        next(error);
    }
};

export const createFeedback = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const { feedback } = req.body;

        await sendFeedback(eventId, req.user.id, feedback);

        res.status(201).json({
            status: "success",
            message: "Feedback berhasil ditambahkan",
        });
    } catch (error) {
        next(error);
    }
};
