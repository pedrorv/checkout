import { useParams } from "react-router-dom";

export function ProductScreen() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Product</h1>
      <p className="text-sm text-gray-500">
        Product {id} details will live here.
      </p>
    </main>
  );
}
