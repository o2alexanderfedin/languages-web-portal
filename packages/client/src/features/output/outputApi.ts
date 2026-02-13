import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FileTreeResponse, FilePreviewResponse } from '@repo/shared';

/**
 * RTK Query API for output browsing, preview, and download endpoints
 */
export const outputApi = createApi({
  reducerPath: 'outputApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    /**
     * Get file tree for a project's output directory
     */
    getFileTree: builder.query<{ data: FileTreeResponse }, string>({
      query: (projectId) => `/projects/${projectId}/output`,
    }),

    /**
     * Get file preview with syntax highlighting metadata
     */
    getFilePreview: builder.query<
      { data: FilePreviewResponse },
      { projectId: string; filePath: string }
    >({
      query: ({ projectId, filePath }) =>
        `/projects/${projectId}/preview/${encodeURIComponent(filePath)}`,
    }),
  }),
});

export const { useGetFileTreeQuery, useGetFilePreviewQuery } = outputApi;
