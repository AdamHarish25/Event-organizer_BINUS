import { saveNewEvent } from "../service/event.service.js";
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
        EventModel: db.Event,
    };

    try {
        await saveNewEvent(req.user.id, req.body, req.file, model);
        res.status(200).json({
            status: "success",
            message: "Event Successly Created",
        });
    } catch (error) {
        next(error);
    }
};
