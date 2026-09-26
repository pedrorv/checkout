import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge, Button } from "../ui";
import { ThemeToggle } from "./ThemeToggle";

type AppHeaderProps = {
  cartCount: number;
};

export function AppHeader({ cartCount }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span>Snack Bar</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" asChild className="relative">
            <Link to="/cart">
              <ShoppingCart />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center p-0">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
