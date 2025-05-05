import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './user/userSlice';
import themeReducer from './theme/themeSlice';

// Configuration constants
const PERSIST_CONFIG = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['user', 'theme']
};

// Use import.meta.env for Vite environment variables
const VERIFICATION_THRESHOLDS = {
  ACTIVITY_SCORE: import.meta.env.VITE_VERIFY_ACTIVITY_SCORE || 50,
  LOGIN_COUNT: import.meta.env.VITE_VERIFY_LOGIN_COUNT || 5
};

const rootReducer = combineReducers({
  user: userReducer,
  theme: themeReducer
});

const persistedReducer = persistReducer(PERSIST_CONFIG, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  preloadedState: {
    user: {
      verificationStatus: {
        requiredActivityScore: VERIFICATION_THRESHOLDS.ACTIVITY_SCORE,
        requiredLoginCount: VERIFICATION_THRESHOLDS.LOGIN_COUNT
      }
    }
  }
});

export const persistor = persistStore(store);

// Development utility (using import.meta.env)
if (import.meta.env.MODE === 'development') {
  window.purgeReduxStore = async () => {
    await persistor.purge();
    console.log('Redux store purged');
    window.location.reload();
  };
}