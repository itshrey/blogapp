import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensure username is always lowercase
      trim: true, // Remove spaces before and after
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9]{7,20}$/.test(value); // Must be 7-20 characters, letters & numbers only
        },
        message: "Username must be 7-20 characters long and contain only letters & numbers.",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Remove spaces before and after
      lowercase: true, // Ensure emails are stored in lowercase
      match: [/.+\@.+\..+/, "Please enter a valid email"], // Basic email format validation
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^(?=.*[A-Z])(?=.*[\W_]).{7,15}$/.test(value);
        },
        message:
          "Password must be 7-15 characters long, contain at least one uppercase letter, and one special character.",
      },
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
  },
  { timestamps: true } // Auto-generate createdAt & updatedAt timestamps
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is unchanged

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
export default User;
