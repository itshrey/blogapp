import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/error.js";
import User from "../models/User.model.js";

// Fix for verifyToken middleware
export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
    console.log("Token:", token);
    

    
    if (!token) {

      return next(errorHandler(401, "Authentication required"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log("Token verification failed:", err);
        return next(errorHandler(403, "Invalid or expired token"));
      }
      
      // Store decoded info immediately to ensure it's available
      // even if the async user fetch fails
      req.user = {
        id: decoded.id,
        isAdmin: decoded.isAdmin || false,
        isVerified: decoded.isVerified || false
      };
      
      console.log("JWT decoded successfully:", {
        id: decoded.id,
        isAdmin: decoded.isAdmin,
        isVerified: decoded.isVerified
      });
      
      // Now fetch the user for additional data (but don't block the middleware chain)
      User.findById(decoded.id)
        .then(user => {
          if (!user) {
            console.log("User not found for ID:", decoded.id);
            // Don't throw error here - we already have basic info from JWT
          } else {
            // Update req.user with fresh data from database
            req.user = {
              id: user._id,
              isAdmin: user.isAdmin,
              isVerified: user.isVerified,
              activityScore: user.activityScore
            };
            
            // Auto-verification logic (doesn't block the middleware chain)
            if (!user.isVerified && 
                user.activityScore >= (process.env.VERIFY_ACTIVITY_SCORE || 100) && 
                user.loginCount >= (process.env.VERIFY_LOGIN_COUNT || 5)) {
              user.isVerified = true;
              user.save()
                .then(() => console.log("User auto-verified:", user._id))
                .catch(err => console.error("Auto-verification save failed:", err));
            }
          }
        })
        .catch(error => {
          console.error("Error fetching user details:", error);
          // We don't stop the middleware chain here - we already have basic JWT info
        });
      
      console.log("User verified and proceeding to next middleware");
      next(); // This doesn't wait for the async database operations
    });
  } catch (error) {
    console.error("Unexpected error in verifyToken:", error);
    next(errorHandler(500, "Authentication processing failed"));
  }
};

// Fix for adminOnly middleware
export const adminOnly = (req, res, next) => {
  console.log("adminOnly middleware reached");
  console.log("User object:", JSON.stringify(req.user));
  
  if (!req.user) {
    console.log("No user object found in request");
    return next(errorHandler(401, "Authentication required"));
  }
  
  console.log("Is admin check:", req.user.isAdmin);
  
  if (!req.user.isAdmin) {
    console.log("User is not an admin, access denied");
    return next(errorHandler(403, "Admin privileges required"));
  }
  
  console.log("Admin privileges confirmed, proceeding");
  next();
};
export const verifiedOnly = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(errorHandler(403, 
      `Account verification required (Need ${process.env.VERIFY_ACTIVITY_SCORE} activity points and ${process.env.VERIFY_LOGIN_COUNT} logins)`
    ));
  }
  next();
};

export const trackActivity = async (req, res, next) => {
  if (!req.user) return next();
  
  try {
    const update = { $inc: { activityScore: 1 } };
    
    // Bonus for consecutive daily activity
    const user = await User.findById(req.user.id);
    const lastActive = user.lastActivity?.toDateString();
    const today = new Date().toDateString();
    
    if (lastActive === today) {
      update.$inc.activityScore += 1; // Extra point for daily return
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        ...update,
        lastActivity: new Date()
      }
    );
    next();
  } catch (error) {
    console.error("Activity tracking error:", error);
    next();
  }
};

// New middleware for content ownership checks
export const checkOwnership = (model) => async (req, res, next) => {
  try {
    const resource = await model.findById(req.params.id);
    if (!resource) return next(errorHandler(404, "Resource not found"));
    
    if (resource.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, "You can only manage your own content"));
    }
    next();
  } catch (error) {
    next(error);
  }
};