const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');
const { markNotificationAsRead } = require('../controllers/notificationController');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token');

    console.log('Received token:', token); // Debugging log to check if token is received

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        console.log('Decoded user:', req.user); // Debugging log to check if user is decoded correctly

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
module.exports.isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }
        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};
