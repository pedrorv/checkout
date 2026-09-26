import { Route } from "react-router-dom";

import { lazyNamed } from "@/shared";

const MenuScreen = lazyNamed(() => import("./screens"), "MenuScreen");

export const menuRoutes = () => (
  <>
    <Route path="/" element={<MenuScreen />} />
  </>
);
