const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

exports.Getapiprev = async (req, res, next) => {
    const customKey = req.query.customKey || req.body.customKey;
    // **Allow access to the login page**

    // **Check if user is logged in**
    if (!req.session || !req.session.logged) {
        return res.status(403).send('Access Denied'); // Or redirect to login
    }

    if (req.session.user && req.session.user.previlage) {
        try {
  

            // Combine readonly and readwrite permission
           
        const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

        // Combine readonly and readwrite permissions
        const allowedRoutes = [...prev.readonly, ...prev.readwrite];  

        if (!prev||!allowedRoutes.includes(customKey)) {
            return res.status(403).send('Access Denied'); // Or redirect to login

        }
        } catch (error) {
            return res.status(403).send('Access Denied'); // Or redirect to login

        }
    }

    next();
};
exports.Postapiprev = async (req, res, next) => {
    const customKey = req.query.customKey || req.body.customKey;

    // **Check if user is logged in**
    if (!req.session || !req.session.logged) {
        return res.status(403).send('Access Denied'); // Or redirect to login
    }

    if (req.session.user && req.session.user.previlage) {
        try {
  

            // Combine readonly and readwrite permission
           
        const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

        // Combine readonly and readwrite permissions
        const allowedRoutes = [...prev.readwrite];  

        if (!prev||!allowedRoutes.includes(customKey)) {
            return res.status(403).send('Access Denied'); // Or redirect to login

        }
        } catch (error) {
            return res.status(403).send('Access Denied'); // Or redirect to login

        }
    }

    next();
};
// module.exports = Getapiprev;
