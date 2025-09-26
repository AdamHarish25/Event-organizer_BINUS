import {
    handleDeleteEvent,
    saveNewEventAndNotify,
    sendFeedback,
    editEventService,
    rejectEventService,
    approveEventService,
    getCategorizedEventsService,
    getPaginatedEventsService,
} from "../service/event.service.js";
import db from "../model/index.js";
import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";

export const eventViewer = async (req, res, next) => {
    const { correlationId, user } = req;
    const { id: userId, role } = user;

    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.eventViewer",
        userId,
    });

    const eventDataFetchers = {
        student: getCategorizedEventsService,
        admin: getPaginatedEventsService,
        super_admin: getPaginatedEventsService,
    };

    try {
        controllerLogger.info("Event viewing process started");

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );

        const fetcher = eventDataFetchers[role];

        if (!fetcher) {
            controllerLogger.warn("Unauthorized event access attempt", {
                context: { roleAttempted: role },
            });
            throw new AppError(
                "Kamu tidak memiliki hak untuk melihat sumberdaya ini.",
                403,
                "FORBIDDEN"
            );
        }

        const eventData = await fetcher({
            userId,
            role,
            page,
            limit,
            EventModel: db.Event,
            UserModel: db.User,
            logger: controllerLogger,
        });

        controllerLogger.info("Events fetched successfully", {
            context: {
                role,
                page,
                limit,
            },
        });

        res.status(200).json({
            status: "success",
            data: eventData,
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](`Failed to fetch events: ${error.message}`, {
            context: { role, page: req.query.page, limit: req.query.limit },
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    const { correlationId, user } = req;
    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.createEvent",
        userId: user.id,
    });

    try {
        controllerLogger.info("Event creation process started", {
            context: {
                eventData: req.body,
                fileData: {
                    originalname: req.file?.originalname,
                    mimetype: req.file?.mimetype,
                    size: req.file?.size,
                },
            },
        });

        const model = {
            UserModel: db.User,
            EventModel: db.Event,
            NotificationModel: db.Notification,
        };

        const newEvent = await saveNewEventAndNotify(
            user.id,
            req.body,
            req.file,
            model,
            controllerLogger
        );

        controllerLogger.info("Event created successfully", {
            context: {
                eventId: newEvent.id,
            },
        });

        res.status(201).json({
            status: "success",
            message: "Event successfully created",
            data: {
                eventId: newEvent.id,
            },
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](`Failed to create event: ${error.message}`, {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    const { correlationId, user } = req;
    const userId = user.id;
    const eventId = req.params.eventId;

    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.deleteEvent",
        userId,
        context: { eventId },
    });

    try {
        controllerLogger.info("Event deletion process initiated");

        const model = {
            UserModel: db.User,
            EventModel: db.Event,
            NotificationModel: db.Notification,
        };

        await handleDeleteEvent(userId, eventId, model, controllerLogger);

        controllerLogger.info("Event deleted successfully");

        res.status(200).json({
            status: "success",
            message: "Event Successfully Deleted",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](`Failed to delete event: ${error.message}`, {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const createFeedback = async (req, res, next) => {
    const { correlationId, user } = req;
    const { eventId } = req.params;

    const controllerLogger = logger.child({
        correlationId,
        source: "FeedbackController.createFeedback",
        userId: user.id,
        context: { eventId },
    });

    try {
        const { feedback } = req.body;

        controllerLogger.info("Feedback creation process initiated", {
            context: {
                feedbackContent: feedback,
            },
        });

        const model = {
            EventModel: db.Event,
            NotificationModel: db.Notification,
        };

        await sendFeedback(eventId, user.id, feedback, model, controllerLogger);

        controllerLogger.info("Feedback sent successfully");

        res.status(201).json({
            status: "success",
            message: "Feedback berhasil dikirim.",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Failed to send feedback: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};

export const editEvent = async (req, res, next) => {
    const { correlationId, user } = req;
    const adminId = user.id;
    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.editEvent",
        userId: adminId,
    });

    const model = {
        UserModel: db.User,
        EventModel: db.Event,
        NotificationModel: db.Notification,
    };

    try {
        const eventId = req.params.eventId;
        const data = req.body;
        const image = req.file;

        controllerLogger.info("Event update process started", {
            context: {
                eventId,
                updateData: data,
                fileData: image
                    ? {
                          originalname: image.originalname,
                          mimetype: image.mimetype,
                          size: image.size,
                      }
                    : null,
            },
        });

        await editEventService(
            eventId,
            adminId,
            data,
            image,
            model,
            controllerLogger
        );

        controllerLogger.info("Event updated successfully", {
            context: { eventId },
        });

        res.status(200).json({
            status: "success",
            message: "Event berhasil diperbarui.",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](`Failed to update event: ${error.message}`, {
            context: { eventId: req.params.eventId },
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const rejectEvent = async (req, res, next) => {
    const { correlationId, user } = req;
    const superAdminId = user.id;
    const eventId = req.params.eventId;

    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.rejectEvent",
        userId: superAdminId,
        context: { eventId },
    });

    try {
        const { feedback } = req.body;

        controllerLogger.info("Event rejection process initiated", {
            context: {
                feedback: feedback,
            },
        });

        const model = {
            EventModel: db.Event,
            NotificationModel: db.Notification,
        };

        await rejectEventService(
            eventId,
            superAdminId,
            feedback,
            model,
            controllerLogger
        );

        controllerLogger.info("Event rejected successfully");

        res.status(200).json({
            status: "success",
            message: "Event berhasil ditolak.",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](`Failed to reject event: ${error.message}`, {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const approveEvent = async (req, res, next) => {
    const { correlationId, user } = req;
    const superAdminId = user.id;
    const eventId = req.params.eventId;

    const controllerLogger = logger.child({
        correlationId,
        source: "EventController.approveEvent",
        userId: superAdminId,
        context: { eventId },
    });

    try {
        controllerLogger.info("Event approval process initiated");

        const model = {
            EventModel: db.Event,
            NotificationModel: db.Notification,
        };

        await approveEventService(
            eventId,
            superAdminId,
            model,
            controllerLogger
        );

        controllerLogger.info("Event approved successfully");

        res.status(200).json({
            status: "success",
            message: "Event berhasil disetujui.",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Failed to approve event: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};
