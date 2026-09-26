import { cn } from "@/shared";

import type { CategoryDTO } from "../menu.types";

type CategorySidebarProps = {
  categories: CategoryDTO[];
  activeCategory: string | null;
  onSelect: (slug: string) => void;
};

export function CategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav className="flex w-full shrink-0 flex-col gap-1 md:w-56">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-current={activeCategory === category.slug ? "true" : undefined}
          className={cn(
            "rounded-md px-4 py-3 text-left text-base font-medium transition-colors hover:bg-accent",
            activeCategory === category.slug
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => onSelect(category.slug)}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
