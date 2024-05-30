const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes'); // Import authRoutes
const authMiddleware = require('./middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const session = require('express-session');

require('dotenv').config();
const passport = require('passport');

require('./config/passport'); // Import Passport configuration

const certificateRoutes = require('./routes/certificateRoutes'); // Import certificateRoutes
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

console.log('AWS S3 configured with region:', process.env.AWS_REGION);

// Set up multer storage engine for temporary file storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50000000 } // 50MB limit
});

console.log('Multer configured for memory storage with file size limit: 50MB');

// Function to upload files to S3
const uploadToS3 = (file, folder) => {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `${folder}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    console.log(`Uploading ${file.originalname} to S3 in folder ${folder}`);
    return s3.upload(params).promise();
};

// Route for handling image uploads
app.post('/upload/image', upload.single('image'), async (req, res) => {
    console.log('Image upload route called');
    try {
        if (!req.file) {
            console.log('No image file selected');
            return res.status(400).json({ error: 'No file selected' });
        }

        console.log('Image file received:', req.file.originalname);
        const data = await uploadToS3(req.file, 'images');
        console.log('Image successfully uploaded to S3:', data.Location);
        res.json({ filePath: data.Location });
    } catch (error) {
        console.error('Error uploading image:', error.message);
        res.status(500).json({ error: 'Error uploading image: ' + error.message });
    }
});

// Route for handling video uploads
app.post('/upload/video', upload.single('video'), async (req, res) => {
    console.log('Video upload route called');
    try {
        if (!req.file) {
            console.log('No video file selected');
            return res.status(400).json({ error: 'No file selected' });
        }

        console.log('Video file received:', req.file.originalname);
        const data = await uploadToS3(req.file, 'videos');
        console.log('Video successfully uploaded to S3:', data.Location);
        res.json({ filePath: data.Location });
    } catch (error) {
        console.error('Error uploading video:', error.message);
        res.status(500).json({ error: 'Error uploading video: ' + error.message });
    }
});
// Session management
app.use(session({
    secret: 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA', // Replace with your secret
    resave: false,
    saveUninitialized: true,
}));
// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes); // Use authRoutes for authentication
app.use('/api/certificates', certificateRoutes); // Use certificateRoutes for certificates
app.use('/api/notifications', notificationRoutes); // Use notificationRoutes
app.use('/api/categories', notificationRoutes); // Use notificationRoutes

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
