"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);
  return null;
}
