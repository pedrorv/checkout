import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { menuRoutes } from "@/features/menu";
import { ordersRoutes } from "@/features/orders";

export function AppRouter() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {menuRoutes()}
        {ordersRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
