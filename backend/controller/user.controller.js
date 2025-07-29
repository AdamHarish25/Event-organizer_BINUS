import db from "../model/index.js";
import { getEventService } from "../service/event.service.js";

export const eventViewer = async (req, res) => {
    try {
        const event = await getEventService(db.EventModel);
        res.json({
            status: "success",
            data: event,
        });
    } catch (error) {
        next(error);
    }
};
