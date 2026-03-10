import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/apiClient';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: 'include', // ensure auth cookies (auth_token) are sent/received
  }),
  tagTypes: ['User', 'PurchaseOrder'],
  endpoints: (builder) => ({
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, _err, id) => [{ type: 'User', id }],
    }),
    listPOs: builder.query({
      query: () => '/purchase-orders',
      providesTags: ['PurchaseOrder'],
    }),
    createPO: builder.mutation({
      query: (body) => ({
        url: '/purchase-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    createWorkspace: builder.mutation({
      query: (body) => ({ url: '/workspaces', method: 'POST', body }),
    }),
    joinWorkspace: builder.mutation({
      query: (body) => ({ url: '/workspaces/join', method: 'POST', body }),
    }),
    regenerateJoinCode: builder.mutation({
      query: ({ workspaceId, requesterUserId }) => ({
        url: `/workspaces/${workspaceId}`,
        method: 'PATCH',
        body: { requesterUserId },
      }),
    }),
    listWorkspaceMembers: builder.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: (result, _err, workspaceId) => [{ type: 'Workspace', id: workspaceId }],
    }),
  }),
});

export const {
  useGetUserByIdQuery,
  useListPOsQuery,
  useCreatePOMutation,
  useLoginMutation,
  useRegisterMutation,
  useCreateWorkspaceMutation,
  useJoinWorkspaceMutation,
  useRegenerateJoinCodeMutation,
  useListWorkspaceMembersQuery,
} = api;
