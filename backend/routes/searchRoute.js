const express = require("express");
const router = express.Router();
const { query } = require('express-validator');
const {  searchUsers} = require("../controllers/searchController");


router.get(
    '/search/users',
    [
      query('q').optional().isString().trim().escape(),
      query('role').optional().isString().trim().escape(),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ], 
    searchUsers
  );

module.exports = router;