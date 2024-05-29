const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const AWS = require('aws-sdk');
const path = require('path');

// AWS SDK Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Route to get certificate by uniqueId
router.get('/:uniqueId', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId }).populate('user', 'name');
        if (!certificate) {
            return res.status(404).json({ msg: 'Certificate not found' });
        }
        res.json(certificate);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

// Route to download certificate by uniqueId
router.get('/:uniqueId/download', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId });
        if (!certificate) {
            return res.status(404).json({ msg: 'Certificate not found' });
        }

        const filePath = certificate.filePath;
        const bucketName = 'sanjaybasket';
        const key = filePath.split(`${bucketName}/`)[1]; // Correctly extract the S3 key

        if (!key) {
            return res.status(404).json({ msg: 'File key extraction failed' });
        }

        // Generate a signed URL for downloading the file from S3
        const params = {
            Bucket: sanjaybasket,
            Key: key,
            Expires: 60 // URL expiration time in seconds
        };

        s3.getSignedUrl('getObject', params, (err, url) => {
            if (err) {
                console.error('Error generating signed URL:', err);
                return res.status(500).json({ msg: 'Error generating signed URL' });
            }
            res.redirect(url); // Redirect to the signed URL
        });
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

// Route to fetch all certificates based on query parameters
router.get('/', async (req, res) => {
    try {
        let query = {};
        const { userName, uniqueId, date } = req.query;

        if (userName) {
            const users = await User.find({ name: { $regex: new RegExp(userName, 'i') } });
            const userIds = users.map(user => user._id);
            query['user'] = { $in: userIds };
        }

        if (uniqueId) {
            query['uniqueId'] = uniqueId;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query['date'] = { $gte: startOfDay, $lte: endOfDay };
        }

        const certificates = await Certificate.find(query).populate('user', 'name');
        res.json(certificates);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
