import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-bold text-bark mb-3">Order Confirmed!</h1>
        <p className="text-bark/60 mb-2">
          Thank you for your purchase. Your fragrance is being prepared with care.
        </p>
        {id && (
          <p className="text-sm text-bark/40 mb-8">Order #{id}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/account" className="btn-primary">View My Orders</Link>
          <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
