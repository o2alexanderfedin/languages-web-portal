import { configureStore } from "@reduxjs/toolkit";
import { healthApi } from "@/features/health/api";
export const store = configureStore({
    reducer: {
        [healthApi.reducerPath]: healthApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(healthApi.middleware),
});
