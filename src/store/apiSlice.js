import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/apiClient';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: 'include',
  }),
  tagTypes: ['User', 'PurchaseOrder', 'Supplier', 'Address', 'Dashboard'],
  endpoints: (builder) => ({
    // Users
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, _err, id) => [{ type: 'User', id }],
    }),

    // Purchase Orders
    listPOs: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.set(k, v);
        });
        const str = qs.toString();
        return `/purchase-orders${str ? `?${str}` : ''}`;
      },
      providesTags: ['PurchaseOrder'],
    }),
    getPO: builder.query({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (result, _err, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPO: builder.mutation({
      query: (body) => ({ url: '/purchase-orders', method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),
    updatePO: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/purchase-orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),
    deletePO: builder.mutation({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),
    listApprovals: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.set(k, v);
        });
        const str = qs.toString();
        return `/purchase-orders/approvals${str ? `?${str}` : ''}`;
      },
      providesTags: ['PurchaseOrder'],
    }),

    // Suppliers
    listSuppliers: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.set(k, v);
        });
        const str = qs.toString();
        return `/suppliers${str ? `?${str}` : ''}`;
      },
      providesTags: ['Supplier'],
    }),
    createSupplier: builder.mutation({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Supplier'],
    }),

    // Addresses
    listAddresses: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.set(k, v);
        });
        const str = qs.toString();
        return `/addresses${str ? `?${str}` : ''}`;
      },
      providesTags: ['Address'],
    }),
    createAddress: builder.mutation({
      query: (body) => ({ url: '/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/addresses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),

    // Dashboard
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    // Auth
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    // Workspaces
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
    }),
  }),
});

export const {
  useGetUserByIdQuery,
  useListPOsQuery,
  useGetPOQuery,
  useCreatePOMutation,
  useUpdatePOMutation,
  useDeletePOMutation,
  useListApprovalsQuery,
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetDashboardQuery,
  useLoginMutation,
  useRegisterMutation,
  useCreateWorkspaceMutation,
  useJoinWorkspaceMutation,
  useRegenerateJoinCodeMutation,
  useListWorkspaceMembersQuery,
} = api;
