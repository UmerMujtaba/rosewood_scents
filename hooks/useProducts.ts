"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct as apiCreate, updateProduct as apiUpdate, deleteProduct as apiDelete } from "@/lib/api/products";
import type { ProductPayload } from "@/lib/api/products";

export function useProducts() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const create = useMutation({
    mutationFn: (payload: ProductPayload) => apiCreate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductPayload> }) => apiUpdate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return { query, create, update, remove };
}
