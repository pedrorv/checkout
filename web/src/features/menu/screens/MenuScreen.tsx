import { useState } from "react";

import { useActiveOrder } from "@/features/orders";
import { AppHeader, Skeleton } from "@/shared";

import { CategorySidebar } from "../components/CategorySidebar";
import { ProductCard } from "../components/ProductCard";
import { useListCategories } from "../hooks/useListCategories.query";
import { useListProducts } from "../hooks/useListProducts.query";

const PRODUCTS_LIMIT = 100;

export function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useListCategories({ limit: PRODUCTS_LIMIT });
  const activeCategorySlug =
    activeCategory ?? categories.data?.data[0]?.slug ?? null;
  const products = useListProducts(
    {
      category: activeCategorySlug ?? undefined,
      limit: PRODUCTS_LIMIT,
    },
    { enabled: activeCategorySlug !== null },
  );
  const activeOrder = useActiveOrder();

  const order = activeOrder.data;
  const cartCount =
    order?.status === "pending"
      ? order.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
  const activeCategoryName =
    categories.data?.data.find(
      (category) => category.slug === activeCategorySlug,
    )?.name ?? null;

  return (
    <div className="min-h-screen">
      <AppHeader cartCount={cartCount} />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {categories.isLoading ? (
            <div className="flex w-full shrink-0 flex-col gap-1 md:w-56">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="h-9 w-full" />
              ))}
            </div>
          ) : categories.isError ? (
            <p className="text-muted-foreground text-sm">
              Could not load categories.
            </p>
          ) : (
            <CategorySidebar
              categories={categories.data?.data ?? []}
              activeCategory={activeCategorySlug}
              onSelect={setActiveCategory}
            />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="mb-4 text-xl font-semibold">
              {activeCategoryName ?? "Menu"}
            </h1>
            {activeCategorySlug === null ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {["a", "b", "c", "d", "e", "f"].map((key) => (
                  <Skeleton key={key} className="h-64 w-full" />
                ))}
              </div>
            ) : products.isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {["a", "b", "c", "d", "e", "f"].map((key) => (
                  <Skeleton key={key} className="h-64 w-full" />
                ))}
              </div>
            ) : products.isError ? (
              <p className="text-muted-foreground text-sm">
                Could not load products.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(products.data?.data ?? []).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={
                      order?.status === "pending"
                        ? (order.items.find(
                            (item) => item.productId === product.id,
                          )?.quantity ?? 0)
                        : 0
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
