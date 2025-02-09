const express = require("express");
const {registerUser, loginUser, loginstatus, loggoutUser, getUser, getUserBalance, allUsers, commisisionBalance} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login",loginUser);
router.get("/loggedin", loginstatus);
router.get("/loggout", loggoutUser);
router.get("/allusers", protect, admin, allUsers);
router.get("/getuser", protect, getUser);
router.get("/userbalance", protect, getUserBalance);
router.get("/commisionBalance", protect, admin, commisisionBalance)

module.exports = router;