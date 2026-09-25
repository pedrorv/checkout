import { useEffect, useState } from "react";

import { getHealth } from "../health.api";

export function HomeScreen() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then(() => {
        if (!cancelled) {
          setStatus("online");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("offline");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p>{status === "loading" ? "Checking API..." : `API: ${status}`}</p>
    </main>
  );
}
