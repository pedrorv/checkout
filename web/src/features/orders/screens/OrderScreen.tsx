import { useParams } from "react-router-dom";

export function OrderScreen() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Order</h1>
      <p className="text-sm text-gray-500">
        Order {id} details will live here.
      </p>
    </main>
  );
}
