import { errorHandler } from "../utils/error.js";
import User from "../models/User.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtp, verifyOtp } from "../utils/otpService.js";
import dotenv from "dotenv";
dotenv.config();

// 1️⃣ Admin Signup - Sends OTP First
export const sendAdminOtp = async (req, res, next) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: "Admin already exists" });
        }

        await sendOtp(email); // Make sure this function is working
        res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        console.error("Error in sendAdminOtp:", error); // Log the actual error
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// 2️⃣ Admin Signup - Verifies OTP and Registers
export const adminSignup = async (req, res, next) => {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password || !otp) {
        return next(errorHandler(400, "All fields are required"));
    }

    if (!verifyOtp(email, otp)) {
        return next(errorHandler(400, "Invalid or expired OTP"));
    }

    try {
        
        const newAdmin = new User({
            username,
            email,
            password,
            isAdmin: true, // Admin flag
        });

        await newAdmin.save();

        const token = jwt.sign({ id: newAdmin._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({ success: true, message: "Admin registered successfully", token });
    } catch (error) {
        next(error);
    }
};

// 3️⃣ User Signup (Normal)

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if all fields are provided
  if (!username || !email || !password) {
    return next(errorHandler(400, "All fields are required"));
  }

  // Validate password (you can use the same regex from your schema)
  const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{7,15}$/;
  if (!passwordRegex.test(password)) {
    return next(
      errorHandler(
        400,
        "Password must be 7-15 characters long, contain at least one uppercase letter, and one special character."
      )
    );
  }

  try {
    // Hash the passwor

    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Ensure the password field exists in the model
    });

    // Save the user to the database
    await newUser.save();

    // Respond with success message
    res.json({ message: "Signup successful" });
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
        console.log("Stored password hash:", validUser.password);
        const validPassword = await bcryptjs.compare(password, validUser.password);
        console.log(validPassword);
        if (!validPassword) return next(errorHandler(400, "Incorrect Password"));

        const token = jwt.sign({ id: validUser._id, isAdmin: validUser.isAdmin }, process.env.JWT_SECRET);

        const { password: pass, ...rest } = validUser._doc;
        res.status(200).cookie("access_token", token, { httpOnly: true }).json(rest);
    } catch (error) {
        next(error);
    }
};

export const google = async (req, res, next) => {
    const { email, name, googlePhotoUrl } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user._doc;
            res.status(200).cookie("access_token", token, { httpOnly: true }).json(rest);
        } else {
            // Function to generate a strong password
            const generateStrongPassword = () => {
                const length = Math.floor(Math.random() * (15 - 7 + 1)) + 7; // Random length between 7 and 15
                const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                const lowercase = "abcdefghijklmnopqrstuvwxyz";
                const numbers = "0123456789";
                const specialChars = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~";

                let password = 
                    uppercase[Math.floor(Math.random() * uppercase.length)] + // Ensure at least one uppercase
                    specialChars[Math.floor(Math.random() * specialChars.length)]; // Ensure at least one special character

                const allChars = uppercase + lowercase + numbers + specialChars;

                for (let i = 2; i < length; i++) {
                    password += allChars[Math.floor(Math.random() * allChars.length)];
                }

                return password.split('').sort(() => 0.5 - Math.random()).join(''); // Shuffle password
            };

            const generatedPassword = generateStrongPassword(); // ✅ Generate a password // ✅ Hash the password

            const newUser = new User({
                username: name.toLowerCase().split(" ").join("") + Math.random().toString(9).slice(-4),
                email,
                password: generatedPassword,  // ✅ Store hashed password
                profilePicture: googlePhotoUrl,
            });
            await newUser.save();

            const token = jwt.sign({ id: newUser._id, isAdmin: false }, process.env.JWT_SECRET);
            const { password, ...rest } = newUser._doc;
            res.status(200).cookie("access_token", token, { httpOnly: true }).json(rest);
        }
    } catch (error) {
        next(error);
    }
};

