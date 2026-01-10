// components/RequireAdminAuth.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequireAdminAuth({ children }) {
  const router = useRouter();

  // useEffect(() => {
  //   const adminSession = localStorage.getItem("adminSession");

  //   if (!adminSession) {
  //     router.replace("/admin/auth");
  //   }
  // }, []);

  return children;
}
