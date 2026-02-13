import { configureStore } from '@reduxjs/toolkit';
import { healthApi } from '@/features/health/api';
import { uploadApi } from '@/features/upload/uploadApi';

export const store = configureStore({
  reducer: {
    [healthApi.reducerPath]: healthApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(healthApi.middleware, uploadApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
