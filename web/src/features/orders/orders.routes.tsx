import { Route } from "react-router-dom";

import { lazyNamed } from "@/shared";

const CartScreen = lazyNamed(() => import("./screens"), "CartScreen");
const OrderScreen = lazyNamed(() => import("./screens"), "OrderScreen");

export const ordersRoutes = () => (
  <>
    <Route path="/cart" element={<CartScreen />} />
    <Route path="/orders/:id" element={<OrderScreen />} />
  </>
);
