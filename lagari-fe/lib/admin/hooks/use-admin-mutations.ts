"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  archiveAdminOrder,
  bulkArchiveAdminOrders,
  bulkDeleteAdminProducts,
  bulkDeleteAdminReviews,
  bulkPatchAdminReviews,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  importShopifyReviews,
  patchAdminOrderNotes,
  patchAdminOrderStatus,
  patchAdminReview,
  updateAdminProduct,
  type AdminOrderStatusPatch,
} from "@/lib/api/admin";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { useAdminToken } from "@/lib/admin/hooks/use-admin-token";

export function useInvalidateAdminOrders() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.ordersAll() });
}

export function usePatchAdminOrderStatus(orderId: string) {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: AdminOrderStatusPatch) =>
      patchAdminOrderStatus(token!, orderId, patch),
    onSuccess: (detail) => {
      queryClient.setQueryData(adminKeys.order(orderId), detail);
      void queryClient.invalidateQueries({ queryKey: adminKeys.ordersAll() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function usePatchAdminOrderNotes(orderId: string) {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminNotes: string | null) =>
      patchAdminOrderNotes(token!, orderId, adminNotes),
    onSuccess: (detail) => {
      queryClient.setQueryData(adminKeys.order(orderId), detail);
    },
  });
}

export function useArchiveAdminOrder(orderId: string) {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archived: boolean) =>
      archiveAdminOrder(token!, orderId, archived),
    onSuccess: (detail) => {
      queryClient.setQueryData(adminKeys.order(orderId), detail);
      void queryClient.invalidateQueries({ queryKey: adminKeys.ordersAll() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useBulkArchiveAdminOrders() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, archived }: { ids: string[]; archived: boolean }) =>
      bulkArchiveAdminOrders(token!, ids, archived),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.ordersAll() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useCreateAdminProduct() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      createAdminProduct(token!, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}

export function useUpdateAdminProduct(productId: string) {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      updateAdminProduct(token!, productId, body),
    onSuccess: (product) => {
      queryClient.setQueryData(adminKeys.product(productId), product);
      void queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}

export function useDeleteAdminProduct() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(token!, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: adminKeys.product(id) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}

export function useBulkDeleteAdminProducts() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminProducts(token!, ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}

export function usePatchAdminReview() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      patchAdminReview(token!, id, isPublished),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "reviews"],
      });
    },
  });
}

export function useDeleteAdminReview() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminReview(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "reviews"],
      });
    },
  });
}

export function useBulkDeleteAdminReviews() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminReviews(token!, ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "reviews"],
      });
    },
  });
}

export function useBulkPatchAdminReviews() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ids,
      isPublished,
    }: {
      ids: string[];
      isPublished: boolean;
    }) => bulkPatchAdminReviews(token!, ids, isPublished),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "reviews"],
      });
    },
  });
}

export function useImportShopifyReviews() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviews,
      publishByDefault,
    }: {
      reviews: Array<Record<string, unknown>>;
      publishByDefault?: boolean;
    }) => importShopifyReviews(token!, reviews, publishByDefault),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "reviews"],
      });
    },
  });
}
