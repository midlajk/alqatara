const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

const Previlagewritemiddle = async (req, res, next) => {
    const customKey = req.headers['x-custom-key'] || req.query.customKey;
    // **Allow access to the login page**
    if (req.path === '/login') {
        return next(); // Skip authentication for login
    }

    // **Check if user is logged in**
    if (!req.session || !req.session.logged) {
        return res.redirect('/login'); // Redirect unauthorized users
    }

    if (req.session.user && req.session.user.previlage) {
        try {
            // Fetch the privilege class based on user's assigned privilege
            const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

            if (!prev) {
                return res.redirect('/login'); // Redirect if no privilege found
            }

            // Combine readonly and readwrite permissions
            const allowedRoutes = [...prev.readonly, ...prev.readwrite];

            // Extract route name from URL path (remove leading `/`)
            const routeName = req.path.substring(1);

            // **Custom Key Override**
            const customKey = req.headers['x-custom-key']; // Get key from request headers
            const allowedCustomKey = 'ALLOW_ACCESS'; // Define the expected custom key

            if (!allowedRoutes.includes(routeName)) {
                if (customKey && customKey === allowedCustomKey) {
                    // If the correct custom key is provided, allow access
                    return next();
                }
                return res.status(403).send('Access Denied'); // Or redirect to login
            }

            // Store privilege info in session for later use
            req.session.user.privileges = {
                readonly: prev.readonly,
                readwrite: prev.readwrite
            };

        } catch (error) {
            console.error('Error in authMiddleware:', error);
            return res.redirect('/login');
        }
    }

    next();
};

module.exports = Previlagewritemiddle;
