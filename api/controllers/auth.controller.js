import { errorHandler } from '../utils/error.js';
import User from './../models/User.model.js';
import bcryptjs from 'bcryptjs';

export const signup = async(req, res, next) => {
    const { username, email, password } = req.body;

    // Check if all fields are provided and not empty
    if (!username || !email || !password || username.trim() === '' || email.trim() === '' || password.trim() === '') {
        return next(errorHandler(400, 'All fields are required'));
    }

    // Hash the password
    const hashPassword = bcryptjs.hashSync(password, 10);

    // Create a new user instance
    const newUser = new User({
        username,
        email,
        password: hashPassword,
    });

    try {
        // Save the new user to the database
        await newUser.save();
        res.json({
            message:"Signup successful"
        });
    } catch (error) {
        next(error);
    };
};
