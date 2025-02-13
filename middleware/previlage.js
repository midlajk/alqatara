const mongoose = require('mongoose');
const PrevilageClass = mongoose.model('PrevilageClass');

const Previlagemiddle = async (req, res, next) => {
    // **Allow access to the login page**
 
        if (req.session.user && req.session.user.previlage) {
            const prev = await PrevilageClass.findOne({ className: req.session.user.previlage });

            // Ensure readonlyAccess is always set
            res.locals.readonlyAccess = prev ? prev.readonly : [];
        } else {
            res.locals.readonlyAccess = [];
        }
  
    next();
};

module.exports = Previlagemiddle;
