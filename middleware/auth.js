const mongoose = require('mongoose');
// const User = mongoose.model('User')
const authMiddleware = async(req, res, next) => {
    // Check for token in request headers
    const admin = req.session.logged;

    // Verify token
    if (!admin) {
        return res.redirect('/login');
    }else{
    //    const user = await User.findOne({uid:req.session.token})
    //    if(user && user.accounttype =='Admin'){
    //     req.session.user = user
    //     next()
    //    }else{
    //     return res.redirect('/login');
    //    }
    next()
    }

 
};

module.exports = authMiddleware;