// components/RequireAuth.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }) {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("customerSession");

    if (!session) {
      router.replace("/auth");
    }
  }, []);

  return children;
}
