const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    }
});

// Function to send notification email
const sendNotificationEmail = (email, title, category) => {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: email,
        subject: `Exciting Announcement: New Post Alert in ${category} on HogwartsEdx`,
        html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
            <header style="text-align: center; margin-bottom: 20px;">
                <img src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/email_hogwartsedx_logo.jpeg" alt="HogwartsEdx Logo" style="max-width: 200px;">
            </header>
            <section style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h2 style="text-align: center; color: #007bff;">New Post Notification</h2>
                <div style="margin-top: 20px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Check out the new post: <a href="https://hogwartsedx.vercel.app/category" style="color: #007bff; text-decoration: none;">${title}</a></p>
                </div>
            </section>
            <footer style="text-align: center; margin-top: 20px;">
                <p style="font-size: 14px; color: #777;">Thank you for being a part of HogwartsEdx!</p>
                <p style="font-size: 14px; color: #777;">For any queries, contact us at <a href="mailto:sanjay.patidar.eduxcel@gmail.com" style="color: #007bff;">sanjay.patidar.eduxcel@gmail.com</a></p>
            </footer>
        </div>
    `    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`Error sending email to ${email}:`, error);
        }
    });
};

// Get all posts
const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get post by slug
const getPostBySlug = async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search blog posts
const searchPosts = async (req, res) => {
    const { keyword } = req.query;
    try {
        const posts = await Post.find({
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ]
        });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user-specific posts
const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.user.name }).sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a post
const createPost = async (req, res) => {
    const { title, category, content, titleImage, titleVideo, summary, subtitles } = req.body;
    
    try {
        const post = new Post({
            title,
            content,
            titleImage,
            titleVideo,
            author: req.user.name,
            summary,
            subtitles,
            category
        });

        const newPost = await post.save();

        // Find users who follow the category
        const users = await User.find({ followedCategories: category });

        for (const user of users) {
            const message = `A new post titled "${title}" has been added to the category "${category}".`;
           
            const notification = new Notification({
                user: user._id,
                message
            });

            await notification.save();

            // Send notification email
            sendNotificationEmail(user.email, message, category);
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { title: req.body.title, content: req.body.content },
            { new: true }
        );
        res.json(updatedPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markPostAsCompleted = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postId = req.params.postId;

        if (!user.completedPosts.includes(postId)) {
            user.completedPosts.push(postId);
            await user.save();
            res.json(user.completedPosts);
        } else {
            res.status(400).json({ msg: 'Post already marked as completed' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getPosts,
    getUserPosts,
    createPost,
    updatePost,
    deletePost,
    getPostBySlug,
    searchPosts
};
