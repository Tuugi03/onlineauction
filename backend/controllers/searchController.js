const User = require("../models/User");
const { validationResult } = require('express-validator');

const searchUsers = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid search parameters',
                errors: errors.array()
            });
        }

        const { q: searchTerm, role } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        
        if (searchTerm) {
            query.$or = [
                { username: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { name: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        const [users, totalCount] = await Promise.all([
            User.find(query)
                .select('-password -refreshToken')
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        res.json({
            status: 'success',
            message: users.length > 0 
                ? `Found ${totalCount} matching users` 
                : 'No users found',
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount
                }
            }
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong with your search',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


module.exports = {
    searchUsers,
    
};