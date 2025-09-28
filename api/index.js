import express from 'express'; // Enable ES modules by adding "type": "module" in package.json
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from './models/User.model.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import { verifyToken,adminOnly } from './middleware/auth.middleware.js';
import aiRoutes from './routes/ai.route.js';
import path from 'path';
dotenv.config();
// Connect to MongoDB
mongoose.connect(process.env.MONGO)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

const app = express();
const _dirname = path.resolve();
// Enable CORS (Allow frontend requests)
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


app.use(express.json()); // Parse JSON data
app.use(cookieParser()); // Parse cookies

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.get('/api/getUsers', verifyToken, adminOnly, async (req, res) => {
  try {
    console.log('GetUsers controller reached');

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find()
      .select('username email profilePicture isAdmin isVerified createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total users count
    const totalUsers = await User.countDocuments();

    // Last month users count
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
      }
    });

    // Send response
    res.status(200).json({
      success: true,
      users,
      totalUsers,
      lastMonthUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });

  } catch (error) {
    console.error('Error in getUsers controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});


app.use('/api/ai', aiRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
app.use(express.static(path.join(_dirname, '/Client/dist')));
app.get('*', (req, res) => {res.sendFile(path.join(_dirname, '/Client/dist/index.html'));});
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
