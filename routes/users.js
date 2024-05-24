var express = require('express');
const authorisation = require("../middleware/authorisation");
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/:email/profile', authorisation, function (req, res, next) {
  const email = req.params.email;

  if (!email) {
    res.status(400).json({ error: true, message: 'No email found' });
  }
  req.db.from("users").select("*").where("email", "=", email)
   .then((rows) => {
     res.json({ "Error": false, "Message": "Success", "Name": rows[0].firstname + " "+ rows[0].lastname})
    })
  
 
});


router.put('/:email/profile', function (req, res, next) {
  // Retrieve email paath params
  const email = req.params.email;
  var rowID = 0;
  // Verify body
  if (!email) {
    return res.status(400).json({
      error: true,
      message: "Path is incomplete - email required"
    });
  
  }
  try {

    // Determine if user already exists in table
    const queryUsers = req.db.from("users").select("*").where("email", "=", email);
    queryUsers.then(users => {
      if (users.length === 0) {
         return res.status(400).json({
        error: true,
        message: "Unknown user - must be a registered user"
        });
       
      } else {
        rowID = users[0].id;
        console.log("The row id is ", rowID);
        console.log(!isNaN(new Date(req.body.dob)));
        console.log(!req.body.firstName + " " + !req.body.lastName + " " + !req.body.dob + " " + !req.body.address);
        /* check req body for structure */
        if (!req.body.firstName || !req.body.lastName || !req.body.address || !req.body.dob || (isNaN(new Date(req.body.dob)))) {        
          return res.status(400).json({
            error: true,
            message: "Invalid profile body format - need valid firstname, lastname, dob, address"
          });
     
        }
        return req.db("users").where({ id: rowID }).update({ firstname: req.body.firstName, lastname: req.body.lastName, suburb: req.body.address, dob: req.body.dob });
      }
    })
      .then(() => {
        return res.status(200).json({ success: true, message: "User details updated" });
    
      })
  } catch (error) {  
     return res.status(500).json({ success: false, message: e.message });
    }
    });

   
    

router.post('/register', function (req, res, next) {
  // Retrieve email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }

  // Determine if user already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers.then(users => {
    if (users.length > 0) {
      throw new Error("User already exists");
    }

    // Insert user into DB
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return req.db.from("users").insert({ email, hash });
  })
.then(() => {
   res.status(201).json({ success: true, message: "User created" });
})
  .catch(e => {
    res.status(500).json({ success: false, message: e.message });
  });
});


router.post('/login',  function (req, res, next) {
 
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers
    .then(users => {
      if (users.length === 0) {
        res.status(400).json({
        error: true,
        message: "Unknown user - must be registered to log in"
        });
        return;
      }
      // Compare password hashes
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then(match => {
      if (!match) {
        res.status(400).json({
        error: true,
        message: ""
        });
        return;
      }
      
  
      // Create and return JWT token
      const expires_in = 60 * 60 * 24; // 24 hours
      const exp = Math.floor(Date.now() / 1000) + expires_in;
      const token = jwt.sign({ email, exp }, process.env.JWT_SECRET_KEY);
      res.status(200).json({
        token,
        token_type: "Bearer",
        expires_in,
        success: "true",
        message: "User Logged IN"

      });
    })
    .then((res) => res.json())
    .then((res) => {
      localStorage.setItem("token", res.token)
    })
  
 
});


module.exports = router;
