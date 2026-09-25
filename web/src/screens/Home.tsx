import { useEffect, useState } from "react";

import { getHealth } from "../api/client";

export default function Home() {
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
    <main>
      <h1>Checkout</h1>
      <p>{status === "loading" ? "Checking API..." : `API: ${status}`}</p>
    </main>
  );
}
