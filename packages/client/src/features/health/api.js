import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const healthApi = createApi({
    reducerPath: "healthApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
    endpoints: (builder) => ({
        getHealth: builder.query({
            query: () => "/health",
        }),
    }),
});
export const { useGetHealthQuery } = healthApi;
