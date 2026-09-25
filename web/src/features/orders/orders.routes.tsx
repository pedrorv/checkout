import { Route } from "react-router-dom";

import { lazyNamed } from "@/shared";

const CartScreen = lazyNamed(() => import("./screens"), "CartScreen");
const CheckoutScreen = lazyNamed(() => import("./screens"), "CheckoutScreen");
const OrderScreen = lazyNamed(() => import("./screens"), "OrderScreen");

export const ordersRoutes = () => (
  <>
    <Route path="/cart" element={<CartScreen />} />
    <Route path="/checkout" element={<CheckoutScreen />} />
    <Route path="/orders/:id" element={<OrderScreen />} />
  </>
);
