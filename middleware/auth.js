const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

const authMiddleware = async (req, res, next) => {
    // **Allow access to the login page**
    if (req.path === '/login') {
        return next(); // Skip authentication for login
    }

    if (!req.session || !req.session.logged) {
        return res.redirect('/login'); // Redirect unauthorized users
    }

    // try {
    //     if (req.session.user && req.session.user.previlage) {
    //         const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

    //         // Ensure readonlyAccess is always set
    //         res.locals.readonlyAccess = prev ? prev.readonly : [];
    //     } else {
    //         res.locals.readonlyAccess = [];
    //     }
    // } catch (error) {
    //     console.error('Error fetching privileges:', error);
    //     res.locals.readonlyAccess = [];
    // }

    next();
};

module.exports = authMiddleware;
