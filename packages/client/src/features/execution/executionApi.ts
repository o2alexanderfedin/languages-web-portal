import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ExecutionRequest, QueueStatus, Tool, ExampleInfo, ExampleLoadResponse } from '@repo/shared';
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

    getExamples: builder.query<{ examples: ExampleInfo[] }, string>({
      query: (toolId) => `/examples/${toolId}`,
    }),

    loadExample: builder.mutation<ExampleLoadResponse, { toolId: string; exampleName: string }>({
      query: ({ toolId, exampleName }) => ({
        url: `/examples/${toolId}/${exampleName}`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useExecuteToolMutation,
  useGetQueueStatusQuery,
  useGetToolsQuery,
  useGetExamplesQuery,
  useLoadExampleMutation,
} = executionApi;
