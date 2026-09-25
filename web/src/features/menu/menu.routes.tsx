import { Route } from "react-router-dom";

import { lazyNamed } from "@/shared";

const MenuScreen = lazyNamed(() => import("./screens"), "MenuScreen");
const ProductScreen = lazyNamed(() => import("./screens"), "ProductScreen");

export const menuRoutes = () => (
  <>
    <Route path="/menu" element={<MenuScreen />} />
    <Route path="/menu/products/:id" element={<ProductScreen />} />
  </>
);
