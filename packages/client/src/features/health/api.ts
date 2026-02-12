import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { HealthResponse } from "@repo/shared";

export const healthApi = createApi({
  reducerPath: "healthApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
