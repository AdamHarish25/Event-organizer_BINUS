import db from "../model/index.js";
import { getEventService } from "../service/event.service.js";

export const eventViewer = async (req, res, next) => {
    const page = req.params.page;
    const limit = req.param.limit;

    try {
        const { data, pagination } = await getEventService(
            db.Event,
            page,
            limit
        );
        res.json({
            status: "success",
            data,
            pagination,
        });
    } catch (error) {
        next(error);
    }
};
