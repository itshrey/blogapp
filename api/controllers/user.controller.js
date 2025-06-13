import { errorHandler } from "../utils/error.js";
import User from '../models/User.model.js';
import bcryptjs from 'bcryptjs';
import Post from '../models/Post.model.js';
import Comment from '../models/Comment.model.js';
import mongoose from 'mongoose';

export const test = (req, res) => {
    res.json({ 
        success: true,
        message: "API is working",
        timestamp: new Date()
    });
};

export const updateUser = async (req, res, next) => {
    try {
        // Authorization check
        console.log(req.user.id, req.params.userId);
        if (req.user.id.toString() !== req.params.userId && !req.user.isAdmin) {
            return next(errorHandler(403, "Unauthorized to update this user"));
        }

        // Initialize update object
        const updateData = {};

        // Password update
        if (req.body.password) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{7,15}$/;
            if (!passwordRegex.test(req.body.password)) {
                return next(errorHandler(400, 
                    "Password must be 7-15 characters with 1 uppercase and 1 special character"
                ));
            }
            updateData.password = bcryptjs.hashSync(req.body.password, 10);
        }

        // Username update
        if (req.body.username) {
            if (req.body.username.length < 7 || req.body.username.length > 20) {
                return next(errorHandler(400, "Username must be 7-20 characters"));
            }
            if (!/^[a-z0-9]+$/.test(req.body.username)) {
                return next(errorHandler(400, 
                    "Username must be lowercase alphanumeric without spaces"
                ));
            }
            updateData.username = req.body.username.toLowerCase();
        }

        // Email update
        if (req.body.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
                return next(errorHandler(400, "Invalid email format"));
            }
            updateData.email = req.body.email.toLowerCase();
        }

        // Profile picture update
        if (req.body.profilePicture) {
            updateData.profilePicture = req.body.profilePicture;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            user: updatedUser
        });

    } catch (error) {
        if (error.code === 11000) {
            return next(errorHandler(400, "Username or email already exists"));
        }
        next(errorHandler(500, "Failed to update user", error));
    }
};



export const deleteUser = async (req, res, next) => {
    try {
        // Validate userId param
        const { userId } = req.params;
        if (!userId) {
            return next(errorHandler(400, "User ID is required"));
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(errorHandler(400, "Invalid user ID format"));
        }

        // Fetch user to delete
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return next(errorHandler(404, "User not found"));
        }

        // Auth checks
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const isSelfOrAdmin = req.user.id.toString() === userId || req.user.isAdmin;
        if (!isSelfOrAdmin) {
            return next(errorHandler(403, "Unauthorized to delete this user"));
        }

        // Prevent deleting admin accounts
        if (userToDelete.isAdmin) {
            return next(errorHandler(403, "Admin accounts cannot be deleted"));
        }

        // Start transaction
        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            await User.findByIdAndDelete(userId).session(session);

            if (Post) {
                await Post.deleteMany({ userId }).session(session);
            }

            if (Comment) {
                await Comment.deleteMany({ userId }).session(session);
            }
        });

        session.endSession();

        return res.status(200).json({
            success: true,
            message: "User and all associated content deleted"
        });

    } catch (error) {
        console.error("Delete user error:", error);
        return next(errorHandler(500, "Failed to delete user", error));
    }
};

export const signout = (req, res, next) => {
    try {
        res.clearCookie('access_token', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        }).status(200).json({
            success: true,
            message: "Signed out successfully"
        });
    } catch (error) {
        next(errorHandler(500, "Failed to sign out", error));
    }
};


export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        // Only allow admin or the user themselves to view full profile
      

        // Get user stats
        const [postCount, commentCount] = await Promise.all([
            Post.countDocuments({ userId: user._id }),
            Comment.countDocuments({ userId: user._id })
        ]);

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                stats: { postCount, commentCount }
            }
        });

    } catch (error) {
        next(errorHandler(500, "Failed to fetch user", error));
    }
};


