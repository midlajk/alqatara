const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');
const createError = require('http-errors');

const Previlagewritemiddle = async (req, res, next) => {
    const customKey = req.query.customKey || req.body.customKey;
    // **Allow access to the login page**

    // **Check if user is logged in**
    if (!req.session || !req.session.logged) {
        return res.redirect('/login'); // Redirect unauthorized users
    }

    if (req.session.user && req.session.user.previlage) {
        try {
            // Fetch the privilege class based on user's assigned privilege
            const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

            if (!prev) {
            return next(createError(400, 'No previlage USER.'));
            }

            // Combine readonly and readwrite permissions
            const allowedRoutes = prev.readwrite;
            // Extract route name from URL path (remove leading `/`)


            if (!allowedRoutes.includes(customKey)) {
                return next(createError(400, 'No previlage.'));

            }

            next();


        } catch (error) {
            return next(createError(400, 'Something went wrong .'));

        }
    }else{
        return next(createError(400, 'Something went wrong .'));

    }

};

module.exports = Previlagewritemiddle;
