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
        // Check if user ID exists in params
        if (!req.params.userId) {
            return next(errorHandler(400, "User ID is required"));
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return next(errorHandler(400, "Invalid user ID format"));
        }

        // Check if user exists before attempting deletion
        const userToDelete = await User.findById(req.params.userId);
        if (!userToDelete) {
            return next(errorHandler(404, "User not found"));
        }

        // Authorization check
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }
        
        if (req.user.id.toString() !== req.params.userId && !req.user.isAdmin) {
            return next(errorHandler(403, "Unauthorized to delete this user"));
        }

        // Admin protection
        if (userToDelete.isAdmin) {
            return next(errorHandler(403, "Admin accounts cannot be deleted"));
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Delete user's posts and comments
            const deletePromises = [
                User.findByIdAndDelete(req.params.userId).session(session)
            ];
            
            // Only attempt to delete posts/comments if these models exist
            if (Post) {
                deletePromises.push(Post.deleteMany({ userId: req.params.userId }).session(session));
            }
            
            if (Comment) {
                deletePromises.push(Comment.deleteMany({ userId: req.params.userId }).session(session));
            }
            
            await Promise.all(deletePromises);

            await session.commitTransaction();
            res.status(200).json({
                success: true,
                message: "User and all associated content deleted"
            });

        } catch (error) {
            await session.abortTransaction();
            console.error("Transaction error:", error);
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error("Delete user error:", error);
        next(errorHandler(500, "Failed to delete user", error));
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


