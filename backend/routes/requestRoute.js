const express = require('express');
const router = express.Router();
const {
  getRequests,
  addRequest,
  deleteRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRequests)
  .post(protect, addRequest);

router.route('/:id')
  .delete(protect, deleteRequest);


module.exports = router;