
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')


exports.gettrucks = async (req, res) => {
    console.log('here')
    try {
        const trucks = await Truck.find();
        console.log(trucks);
        res.json(trucks);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trucks' });
      }

  };