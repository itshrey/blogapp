import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Store OTPs temporarily (Use Redis or DB in production)
const otpStore = new Map();

export const generateOtp = (email) => {
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    otpStore.set(email, otp);
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000); // OTP expires in 5 minutes
    return otp;
};

export const sendOtp = async (email) => {
    const otp = generateOtp(email);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Admin Signup",
        text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

export const verifyOtp = (email, otp) => {
    return otpStore.get(email) === otp;
};
