import { startOfToday, endOfToday, endOfWeek } from "date-fns";
import { Op } from "sequelize";
import AppError from "../../utils/AppError.js";
import { Event } from "../../model/index.js";

export const getEventsByCategory = async ({ logger }) => {
    try {
        logger.info("Fetching categorized events from database");

        const commonOptions = {
            where: { status: "approved" },
            order: [
                ["date", "ASC"],
                ["startTime", "ASC"],
            ],
            attributes: [
                "id",
                "eventName",
                "description",
                "date",
                "startTime",
                "endTime",
                "location",
                "speaker",
                "imageUrl",
            ],
        };

        const today = new Date();

        const [currentEvents, thisWeekEvents, nextEvents] = await Promise.all([
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: { [Op.eq]: startOfToday() },
                },
            }),
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: {
                        [Op.gt]: endOfToday(),
                        [Op.lte]: endOfWeek(today, { weekStartsOn: 1 }),
                    },
                },
            }),
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: { [Op.gt]: endOfWeek(today, { weekStartsOn: 1 }) },
                },
            }),
        ]);

        logger.info("Successfully fetched categorized events", {
            context: {
                resultCounts: {
                    current: currentEvents.length,
                    thisWeek: thisWeekEvents.length,
                    next: nextEvents.length,
                },
            },
        });

        return {
            current: currentEvents,
            thisWeek: thisWeekEvents,
            next: nextEvents,
        };
    } catch (error) {
        logger.error(
            "Failed to fetch categorized events due to a database error",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal mengambil data event.",
            500,
            "DATABASE_ERROR"
        );
    }
};

export const getPaginatedEvents = async (options) => {
    const { userId, role, page, limit, logger } = options;

    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        logger.info("Fetching paginated events from database", {
            context: { role, page: pageNum, limit: limitNum },
        });

        const whereClause = {};
        if (role === "admin") {
            whereClause.creatorId = userId;
            logger.info(
                "Applying filter for admin role: fetching own events only",
                {
                    context: { creatorId: userId },
                }
            );
        }

        const { count, rows } = await Event.findAndCountAll({
            where: whereClause,
            limit: limitNum,
            offset,
            order: [["createdAt", "DESC"]],
        });

        logger.info("Successfully fetched paginated events", {
            context: {
                role,
                pagination: {
                    totalItems: count,
                    returnedItems: rows.length,
                    currentPage: pageNum,
                },
            },
        });

        return {
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limitNum),
                currentPage: pageNum,
            },
        };
    } catch (error) {
        logger.error(
            "Failed to fetch paginated events due to a database error",
            {
                context: { role, page, limit },
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal mengambil daftar event.",
            500,
            "DATABASE_ERROR"
        );
    }
};
