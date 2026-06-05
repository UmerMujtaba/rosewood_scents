"use client";
import { CartProvider } from "@/components/cart-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <CartProvider>{children}</CartProvider>
    </QueryClientProvider>
  );
}
