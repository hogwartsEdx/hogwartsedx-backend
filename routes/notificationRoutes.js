// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Post = require('../models/Post');

const Notification = require('../models/Notification');

// Follow a category
router.post('/follow-category', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const { category } = req.body;
        if (!user.followedCategories.includes(category)) {
            user.followedCategories.push(category);
            await user.save();
        }

        res.json(user.followedCategories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Unfollow a category
router.post('/unfollow-category', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const { category } = req.body;
        user.followedCategories = user.followedCategories.filter(cat => cat !== category);
        await user.save();

        res.json(user.followedCategories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ date: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get notifications for a user
router.get('/', authMiddleware, getNotifications);

// Mark a notification as read
router.put('/:id/read', authMiddleware, markNotificationAsRead);

module.exports = router;
