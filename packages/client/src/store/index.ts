import { configureStore } from '@reduxjs/toolkit';
import { healthApi } from '@/features/health/api';
import { uploadApi } from '@/features/upload/uploadApi';
import { executionApi } from '@/features/execution/executionApi';
import { outputApi } from '@/features/output/outputApi';

export const store = configureStore({
  reducer: {
    [healthApi.reducerPath]: healthApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [executionApi.reducerPath]: executionApi.reducer,
    [outputApi.reducerPath]: outputApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      healthApi.middleware,
      uploadApi.middleware,
      executionApi.middleware,
      outputApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
