import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { menuRoutes } from "@/features/menu";
import { ordersRoutes } from "@/features/orders";
import { lazyNamed } from "@/shared";

const HomeScreen = lazyNamed(() => import("./screens"), "HomeScreen");

export function AppRouter() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        {menuRoutes()}
        {ordersRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
