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
        console.log(`Fetching certificate with uniqueId: ${req.params.uniqueId}`);
        const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId }).populate('user', 'name');
        if (!certificate) {
            console.log('Certificate not found');
            return res.status(404).json({ msg: 'Certificate not found' });
        }
        console.log('Certificate found:', certificate);
        res.json(certificate);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

// Route to download certificate by uniqueId
router.get('/:uniqueId/download', async (req, res) => {
    try {
        console.log(`Attempting to download certificate with uniqueId: ${req.params.uniqueId}`);
        const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId });
        if (!certificate) {
            console.log('Certificate not found');
            return res.status(404).json({ msg: 'Certificate not found' });
        }

        const filePath = certificate.filePath;
        console.log('File path:', filePath);

        // Extract the S3 key from the URL
        const url = new URL(filePath);
        const key = url.pathname.substring(1); // Remove leading slash
        console.log('Extracted S3 key:', key);

        if (!key) {
            console.log('File key extraction failed');
            return res.status(404).json({ msg: 'File key extraction failed' });
        }

        // Generate a signed URL for downloading the file from S3
        const params = {
            Bucket: 'sanjaybasket',
            Key: key,
            Expires: 60 // URL expiration time in seconds
        };

        console.log('Generating signed URL with params:', params);
        const signedUrl = s3.getSignedUrl('getObject', params);
        console.log('Signed URL generated:', signedUrl);
        
        // Sending the signed URL in the response
        res.json({ url: signedUrl });
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

// Route to fetch all certificates based on query parameters
router.get('/', async (req, res) => {
    try {
        console.log('Fetching certificates with query parameters:', req.query);
        let query = {};
        const { userName, uniqueId, date } = req.query;

        if (userName) {
            console.log(`Searching for users with name matching: ${userName}`);
            const users = await User.find({ name: { $regex: new RegExp(userName, 'i') } });
            const userIds = users.map(user => user._id);
            query['user'] = { $in: userIds };
            console.log('User IDs found:', userIds);
        }

        if (uniqueId) {
            query['uniqueId'] = uniqueId;
            console.log(`Filtering by uniqueId: ${uniqueId}`);
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query['date'] = { $gte: startOfDay, $lte: endOfDay };
            console.log(`Filtering by date: from ${startOfDay} to ${endOfDay}`);
        }

        console.log('Final query:', query);
        const certificates = await Certificate.find(query).populate('user', 'name');
        console.log('Certificates found:', certificates);
        res.json(certificates);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
