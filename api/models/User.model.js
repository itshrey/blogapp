import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9]{7,20}$/.test(value);
        },
        message: "Username must be 7-20 characters long and contain only letters & numbers.",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default:
        "https://imgs.search.brave.com/sHfS5WDNtJlI9C_CT2YL2723HttEALNRtpekulPAD9Q/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2LzMzLzU0Lzc4/LzM2MF9GXzYzMzU0/Nzg0Ml9BdWdZemV4/VHBNSjl6MVljcFRL/VUJvcUJGMENVQ2sx/MC5qcGc",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false, // newly added field
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    activityScore: {
      type: Number,
      default: 0,
    },commentCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },

    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    console.log("Hashed Password:", this.password);
    next();
  } catch (error) {
    next(error);
  }
});






const User = mongoose.model("User", userSchema);
export default User;
