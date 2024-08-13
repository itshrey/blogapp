import mongoose from "mongoose";
import { type } from "os";
 const userSchema = new mongoose.Schema(
    {
      username:{
        type:String,
        required: true,
        unique: true,
      },
      email:{
        type:String,
        required:true,
        unique:true,
      },
      password:{
        type:String,
        required:true,
        
      }
    },{timestamps:true}//to store created at and updated at time
 );

 const User= mongoose.model('User',userSchema);

export default User;