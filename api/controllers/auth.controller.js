import { errorHandler } from '../utils/error.js';
import User from './../models/User.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

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


export const signin = async(req,res,next)=>{
    const {email, password} = req.body;
    if ( !email || !password  || email.trim() === '' || password.trim() === '') {
        return next(errorHandler(400, 'All fields are required'));
    };
    try{
        const validUser= await User.findOne({email});
        if(!validUser){
            return next(errorHandler(404,'User not found'));
        }
        const validPassword= bcryptjs.compareSync(password,validUser.password);
        if(!validPassword){
           return next(errorHandler(400,'Incorrect Password'));
        }
        const token =jwt.sign(
            {
                id: validUser._id
            },process.env.JWT_SECRET,
        )

        const {password:pass, ...rest}=validUser._doc;
        res.status(200).cookie('access_token',token,{
            httpOnly:true
        }).json(rest);


    }catch(error){
        next(error);
    }

}