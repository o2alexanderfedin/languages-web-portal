import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ExecutionRequest, QueueStatus, Tool } from '@repo/shared';
import { TOOLS } from '@repo/shared';

export const executionApi = createApi({
  reducerPath: 'executionApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    executeTool: builder.mutation<{ data: { jobId: string } }, ExecutionRequest>({
      query: (body) => ({
        url: '/execute',
        method: 'POST',
        body,
      }),
    }),

    getQueueStatus: builder.query<{ data: QueueStatus }, void>({
      query: () => '/queue/status',
    }),

    getTools: builder.query<Tool[], void>({
      queryFn: () => ({ data: TOOLS }),
    }),
  }),
});

export const {
  useExecuteToolMutation,
  useGetQueueStatusQuery,
  useGetToolsQuery,
} = executionApi;
