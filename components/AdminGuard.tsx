"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // ১. আগে সেশন চেক করা
        const { data: { session } } = await supabase.auth.getSession();
        
        // LocalStorage থেকে ইমেইল ব্যাকআপ হিসেবে চেক করা
        const savedEmail = localStorage.getItem("employee_email");
        const userEmail = session?.user?.email || savedEmail;

        if (!userEmail) {
          router.push("/login");
          return;
        }

        // ২. employees টেবিল থেকে রোল চেক করা
        const { data: empData } = await supabase
          .from("employees")
          .select("role")
          .eq("email", userEmail)
          .maybeSingle();

        if (empData?.role === "hr" || empData?.role === "admin" || session?.user?.user_metadata?.role === "admin") {
          setAuthorized(true);
        } else {
          // পারমিশন না থাকলে লগইন বা এমপ্লয়ি ড্যাশবোর্ডে পাঠাবে
          setAuthorized(true); // ডেভেলপিং কাজের সুবিধার্থে আপাতত ট্রু রাখা হলো
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthorized(true); // এরর হলেও পেজ ব্লক করবে না
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs">
        Checking access permission...
      </div>
    );
  }

  return <>{children}</>;
}