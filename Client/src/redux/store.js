import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';
import { persistReducer,persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';


// Combine reducers if you have more than one
const rootReducer = combineReducers({
  user: userReducer,
});

// Configuration for redux-persist
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

// Creating a persisted reducer using the persist configuration and root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuring the store with the persisted reducer and middleware
export const store = configureStore({
  reducer: persistedReducer, // Persisted reducer goes here
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Exporting the persistor which will be used in your app entry point
export const persistor= persistStore(store);