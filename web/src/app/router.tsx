import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { menuRoutes } from "@/features/menu";
import { ordersRoutes } from "@/features/orders";
import { Loading } from "@/shared";

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {menuRoutes()}
        {ordersRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
