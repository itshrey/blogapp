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
      },
      profilePicture:{
        type:String,
        default:"https://imgs.search.brave.com/sHfS5WDNtJlI9C_CT2YL2723HttEALNRtpekulPAD9Q/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2LzMzLzU0Lzc4/LzM2MF9GXzYzMzU0/Nzg0Ml9BdWdZemV4/VHBNSjl6MVljcFRL/VUJvcUJGMENVQ2sx/MC5qcGc",
      },
      isAdmin:{
        type:Boolean,
        default:false,
      },
    },{timestamps:true}//to store created at and updated at time
 );

 const User= mongoose.model('User',userSchema);

export default User;