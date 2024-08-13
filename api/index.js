import express from 'express';//to support this add "type":"module" in package.json
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
mongoose.connect(process.env.MONGO)
.then(()=>{console.log("Mongo db is connected")})
.catch((err)=>{
    console.log(err);
})
const app=express();

app.listen(3000,()=>{
    console.log("Server is running on port 3000 ")
})