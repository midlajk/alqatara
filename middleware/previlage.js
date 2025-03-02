const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

const Previlagemiddle = async (req, res, next) => {
    // **Allow access to the login page**
 
        if (req.session.user && req.session.user.previlage) {
            const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });
            const allowedRoutes = [...prev.readonly, ...prev.readwrite];  
            // Ensure readonlyAccess is always set
            res.locals.readonlyAccess = allowedRoutes.length>0 ? allowedRoutes : [];
        } else {
            res.locals.readonlyAccess = [];
        }
  
    next();
};

module.exports = Previlagemiddle;
