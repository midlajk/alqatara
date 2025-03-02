const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

const authMiddleware = async (req, res, next) => {

    // **Allow access to the login page**
    const customKey = req.headers['x-custom-key'] || req.query.customKey;

    if (req.path === '/login') {
        return next(); // Skip authentication for login
    }

    if (!req.session || !req.session.logged) {
        return res.redirect('/login'); // Redirect unauthorized users
    }
    if (req.session.user && req.session.user.previlage) {

        const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

        // Combine readonly and readwrite permissions
        const allowedRoutes = [...prev.readonly, ...prev.readwrite];  

        if (!prev||!allowedRoutes.includes(customKey)) {
            return res.redirect('/login'); // Redirect if no privilege found

        }
    }


    next();
};

module.exports = authMiddleware;
