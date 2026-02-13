import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const uploadApi = createApi({
    reducerPath: 'uploadApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    endpoints: (builder) => ({
        uploadFile: builder.mutation({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: '/upload',
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type - browser will set it with boundary
                };
            },
        }),
        getExamples: builder.query({
            query: (toolId) => `/examples/${toolId}`,
        }),
        loadExample: builder.mutation({
            query: ({ toolId, exampleName }) => ({
                url: `/examples/${toolId}/${exampleName}`,
                method: 'POST',
            }),
        }),
    }),
});
export const { useUploadFileMutation, useGetExamplesQuery, useLoadExampleMutation, } = uploadApi;
