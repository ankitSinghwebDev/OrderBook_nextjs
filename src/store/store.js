import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import { api } from './apiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
