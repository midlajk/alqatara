var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const PrevilageClass = mongoose.model('PrevilageClass')

const Employee = mongoose.model('Employee')

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Save session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      previlage:user.designation
    };
    req.session.logged = true

      if(user.designation){
        const prev = await PrevilageClass.findOne({className:req.session.user.previlage})
          if(prev.readonly.length > 0||prev.readwrite.length){

          return res.status(200).json({ success: true, message: 'Login successful', user: req.session.user,direct:prev.readonly[0]||prev.readwrite[0] });
          
        }
      }
        res.status(200).json({ success: false, message: 'Login successful but no permission', user: req.session.user });
      


 

    
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;
