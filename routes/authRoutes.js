const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware'); // Import isAdmin middleware
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');

// Register a new user
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.register);

// Login user
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], authController.login);

// Forgot password
router.post('/forgot-password', [
    check('email', 'Please include a valid email').isEmail()
], authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.resetPassword);
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

// Get authenticated user
router.get('/user', authMiddleware, authController.getAuthenticatedUser);
// Fetch completed certificates for a user
router.get('/certificates', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Assuming certificates are stored in user.completedCertificates
        const certificates = user.completedCertificates || [];
        res.json(certificates);
    } catch (err) {
        console.error(err.message);
    }
});
router.get('/:uniqueId', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId }).populate('user', 'name');
        if (!certificate) {
            console.log(req.params.uniqueId );

            return res.status(404).json({ msg: 'Certificate not found' });
        }
        res.json(certificate);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
module.exports = router;    
