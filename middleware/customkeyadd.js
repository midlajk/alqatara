const setCustomHeader=  (customValue) => {
    return function (req, res, next) {
        req.query.customKey = customValue;
        req.body.customKey = customValue;
        next();
    };
  };
  
  module.exports = setCustomHeader;
  