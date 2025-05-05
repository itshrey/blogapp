import { errorHandler } from "../utils/error.js";
import User from "../models/User.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtp, verifyOtp } from "../utils/otpService.js";
import dotenv from "dotenv";
dotenv.config();

// Verification thresholds (configurable via environment variables)
const VERIFICATION_THRESHOLDS = {
  LOGIN_COUNT: parseInt(process.env.VERIFY_LOGIN_COUNT) || 5,
  ACTIVITY_SCORE: parseInt(process.env.VERIFY_ACTIVITY_SCORE) || 50
};

// Helper function to auto-verify users
const autoVerifyUser = async (user) => {
  if (user.loginCount >= VERIFICATION_THRESHOLDS.LOGIN_COUNT && 
      user.activityScore >= VERIFICATION_THRESHOLDS.ACTIVITY_SCORE) {
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
      console.log(`User ${user.username} auto-verified`);
    }
  }
};

// 1️⃣ Admin Signup - Sends OTP
// 1️⃣ Admin Signup - Sends OTP with Embedded Secret
export const sendAdminOtp = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return next(errorHandler(400, "Email is required"));
    }

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return next(errorHandler(400, "Admin already exists"));
    }

    // Pass only the email and set isAdmin=true
    await sendOtp(email, true);

    res.status(200).json({
      success: true,
      message: "Admin OTP sent"
    });
  } catch (error) {
    console.error("Admin OTP error:", error);
    next(errorHandler(500, "Failed to send admin OTP"));
  }
};

  
  // 2️⃣ Admin Signup - Verifies OTP and Registers
  export const adminSignup = async (req, res, next) => {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password || !otp) {
        return next(errorHandler(400, "All fields are required"));
    }

    try {
        // Single verification call that checks everything
        if (!verifyOtp(otp, email)) {
            return next(errorHandler(400, "Invalid or expired admin OTP"));
        }

        // Proceed with admin creation
        const newAdmin = new User({
            username,
            email,
            password,
            isAdmin: true,
            isVerified: true,
            adminSince: new Date()
        });

        await newAdmin.save();

        const token = jwt.sign(
            { 
                id: newAdmin._id, 
                isAdmin: true,
                isVerified: true,
                role: 'admin'
            }, 
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const { password: pass, ...rest } = newAdmin._doc;
        
        res.status(201)
            .cookie("access_token", token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            })
            .json({
                success: true,
                message: "Admin registered successfully",
                user: rest
            });
    } catch (error) {
        next(error);
    }
};
// 3️⃣ User Signup
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(errorHandler(400, "All fields are required"));
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{7,15}$/;
  if (!passwordRegex.test(password)) {
    return next(errorHandler(
      400,
      "Password must be 7-15 characters with at least one uppercase letter and one special character."
    ));
  }

  try {
    const newUser = new User({
      username,
      email,
      password,
      isVerified: false,
      activityScore: 10 // Initial score for signing up
    });

    await newUser.save();

    const { password: pass, ...rest } = newUser._doc;
    res.status(201).json({ 
      success: true,
      message: "Signup successful",
      user: rest
    });
  } catch (error) {
    next(error);
  }
};

// 4️⃣ User Signin
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(errorHandler(400, "All fields are required"));
  }

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found"));

    const validPassword = await bcryptjs.compare(password, validUser.password);
    if (!validPassword) return next(errorHandler(400, "Invalid credentials"));

    // Update user activity
    validUser.loginCount += 1;
    validUser.activityScore += 5; // Bonus for regular login
    await validUser.save();

    // Check for auto verification
    await autoVerifyUser(validUser);

    const token = jwt.sign(
      { 
        id: validUser._id, 
        isAdmin: validUser.isAdmin,
        isVerified: validUser.isVerified 
      }, 
      process.env.JWT_SECRET
    );

    const { password: pass, ...rest } = validUser._doc;
    res.status(200)
      .cookie("access_token", token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// 5️⃣ Google Auth
export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;
  
  try {
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user
      user.loginCount += 1;
      user.activityScore += 10; // Higher bonus for social login
      await user.save();
      
      await autoVerifyUser(user);
    } else {
      // Create new user
      const generatedPassword = Math.random().toString(36).slice(-8) + 
                              Math.random().toString(36).slice(-8);
      
      user = new User({
        username: name.toLowerCase().split(" ").join("") + 
                Math.random().toString(9).slice(-4),
        email,
        password: generatedPassword,
        profilePicture: googlePhotoUrl,
        loginCount: 1,
        activityScore: 15, // Initial score for social signup
        isVerified: false
      });
      
      await user.save();
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        isAdmin: user.isAdmin,
        isVerified: user.isVerified 
      }, 
      process.env.JWT_SECRET
    );

    const { password, ...rest } = user._doc;
    res.status(200)
      .cookie("access_token", token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

