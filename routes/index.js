var express = require('express');
const authorisation = require('../middleware/authorisation');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'The World Database API - THE WORLD!!' });
});

router.get('/me', function (req, res, next) {
  res.json({"email" : "a1.gough@qut.edu.au", "ID":"n1028438738" });
});

router.get("/api/city",  function (req, res, next) {
  const queryCity = req.db.from('city').select("name", "district");
  queryCity
    .then(cities => {
      if (cities.length > 0) {
       res.status(200).json({ "Error": false, "Message": "Success", "City": cities })
      
      }      
    })
   
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error in MySQL query" })
    })
});

router.get("/api/city/:CountryCode", function (req, res, next) {
  req.db.from('city').select('*').where('CountryCode', '=', req.params.CountryCode)
    .then((rows) => {
      res.json({ "Error": false, "Message": "Success", "Cities": rows })
    })
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error executing MySQL query" })
    })
});

router.post('/api/update', authorisation, (req, res) => {
 
  if (!req.body.City || !req.body.CountryCode || !req.body.Pop) {
    res.status(400).json({ message: `Error updating population` });
    console.log(`Error on request body:`, JSON.stringify(req.body));

  } else {
    const filter = {
      "Name": req.body.City,
      "CountryCode": req.body.CountryCode
    };
    const pop = {
      "Population": req.body.Pop
    };
    req.db('city').where(filter).update(pop)
      .then(_ => {
        res.status(201).json({ message: `Successful update ${req.body.City}` });
        console.log(`successful population update:`, JSON.stringify(filter));
      }).catch(error => {
        res.status(500).json({ message: 'Database error - not updated' });
      });
  }
});


  

module.exports = router;
