export const eventViewer = (req, res) => {
    res.json({
        message: "Event Viewer",
        user: req.user,
    });
};
