import { createSlice } from '@reduxjs/toolkit';

// Environment variables with fallback values
const VERIFY_ACTIVITY_SCORE = import.meta.env.VITE_VERIFY_ACTIVITY_SCORE || 50;
const VERIFY_LOGIN_COUNT = import.meta.env.VITE_VERIFY_LOGIN_COUNT || 5;

const initialState = {
  currentUser: null,
  error: null,
  loading: false,
  verificationStatus: {
    activityScore: 0,
    loginCount: 0,
    isVerified: false
  }
};

console.log('Initial user state:', initialState); // Log initial state

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Authentication actions
    signInStart: (state) => {
      console.log('signInStart - currentUser before:', state.currentUser);
      state.loading = true;
      state.error = null;
    },
    signInSuccess: (state, action) => {
      const { user, activityScore = 0, loginCount = 0, isVerified = false } = action.payload;
      
      console.log('signInSuccess payload:', action.payload);
      
      state.currentUser = {
        ...user,
        isVerified: isVerified || user.isVerified || false
      };
      
      state.verificationStatus = {
        activityScore,
        loginCount,
        isVerified
      };
      
      state.loading = false;
      state.error = null;
      
      console.log('signInSuccess - currentUser after:', state.currentUser);
      console.log('signInSuccess - verificationStatus:', state.verificationStatus);
    },
    signInFailure: (state, action) => {
      console.log('signInFailure - error:', action.payload);
      state.loading = false;
      state.error = action.payload;
      console.log('signInFailure - currentUser after:', state.currentUser);
    },
    
    // User update actions
    updateStart: (state) => {
      console.log('updateStart - currentUser before:', state.currentUser);
      state.loading = true;
      state.error = null;
    },
    updateSuccess: (state, action) => {
      console.log('updateSuccess payload:', action.payload);
      
      const { user, activityScore, loginCount, isVerified } = action.payload;
      
      state.currentUser = {
        ...state.currentUser,
        ...user,
        isVerified: isVerified ?? state.currentUser?.isVerified
      };
      
      if (activityScore !== undefined || loginCount !== undefined || isVerified !== undefined) {
        state.verificationStatus = {
          activityScore: activityScore ?? state.verificationStatus.activityScore,
          loginCount: loginCount ?? state.verificationStatus.loginCount,
          isVerified: isVerified ?? state.verificationStatus.isVerified
        };
      }
      
      state.loading = false;
      state.error = null;
      
      console.log('updateSuccess - currentUser after:', state.currentUser);
      console.log('updateSuccess - verificationStatus:', state.verificationStatus);
    },
    updateFailure: (state, action) => {
      console.log('updateFailure - error:', action.payload);
      state.loading = false;
      state.error = action.payload;
      console.log('updateFailure - currentUser after:', state.currentUser);
    },
    
    // User deletion actions
    deleteUserStart: (state) => {
      console.log('deleteUserStart - currentUser before:', state.currentUser);
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state) => {
      console.log('deleteUserSuccess - resetting to initialState');
      return initialState;
    },
    deleteUserError: (state, action) => {
      console.log('deleteUserError - error:', action.payload);
      state.loading = false;
      state.error = action.payload;
      console.log('deleteUserError - currentUser after:', state.currentUser);
    },
    
    // Session management
    signoutSuccess: (state) => {
      console.log('signoutSuccess - resetting to initialState');
      return initialState;
    },
    
    // Verification system
    updateActivityScore: (state, action) => {
      console.log('updateActivityScore - increment:', action.payload);
      const increment = action.payload;
      const newScore = state.verificationStatus.activityScore + increment;
      
      state.verificationStatus.activityScore = newScore;
      checkVerificationStatus(state);
      
      console.log('updateActivityScore - currentUser:', state.currentUser);
      console.log('updateActivityScore - verificationStatus:', state.verificationStatus);
    },
    
    incrementLoginCount: (state) => {
      console.log('incrementLoginCount - before:', state.verificationStatus.loginCount);
      state.verificationStatus.loginCount += 1;
      checkVerificationStatus(state);
      
      console.log('incrementLoginCount - after:', state.verificationStatus.loginCount);
      console.log('incrementLoginCount - currentUser:', state.currentUser);
      console.log('incrementLoginCount - verificationStatus:', state.verificationStatus);
    }
  }
});

// Helper function to check and update verification status
function checkVerificationStatus(state) {
  const { activityScore, loginCount, isVerified } = state.verificationStatus;
  
  console.log('checkVerificationStatus - current thresholds:', {
    requiredScore: VERIFY_ACTIVITY_SCORE,
    requiredLogins: VERIFY_LOGIN_COUNT
  });
  
  console.log('checkVerificationStatus - current status:', {
    activityScore,
    loginCount,
    isVerified
  });
  
  if (!isVerified && 
      activityScore >= VERIFY_ACTIVITY_SCORE && 
      loginCount >= VERIFY_LOGIN_COUNT) {
    console.log('checkVerificationStatus - user meets verification criteria!');
    state.verificationStatus.isVerified = true;
    if (state.currentUser) {
      state.currentUser.isVerified = true;
    }
    console.log('checkVerificationStatus - updated currentUser:', state.currentUser);
  } else {
    console.log('checkVerificationStatus - user does not meet verification criteria yet');
  }
}

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  updateStart,
  updateSuccess,
  updateFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserError,
  signoutSuccess,
  updateActivityScore,
  incrementLoginCount
} = userSlice.actions;

export default userSlice.reducer;