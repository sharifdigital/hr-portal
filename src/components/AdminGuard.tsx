"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.user_metadata?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAdmin(false);
        router.push("/login");
      }
    }

    checkAdminStatus();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <p className="text-slate-400 font-semibold animate-pulse">Checking Access Rights...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}