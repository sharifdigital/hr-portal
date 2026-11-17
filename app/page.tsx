"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // ১. সুপাবেস অথেন্টিকেশন দিয়ে লগইন
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const userEmail = data.user?.email?.toLowerCase() || "";

    // ২. ডেটাবেজের 'employees' টেবিল থেকে ইউজারের রোল (Role) বা ইমেইল চেক
    const { data: employeeData } = await supabase
      .from("employees")
      .select("role")
      .eq("email", userEmail)
      .single();

    const role = employeeData?.role?.toLowerCase();

    // ৩. ইমেইলে 'admin'/'hr' থাকলে অথবা ডেটাবেজে রোল 'hr'/'admin' হলে HR ড্যাশবোর্ডে পাঠাবে
    if (
      role === "hr" || 
      role === "admin" || 
      userEmail.includes("admin") || 
      userEmail.includes("hr")
    ) {
      router.push("/hr/dashboard");
    } else {
      router.push("/employee/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0b111e] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold text-white">সিস্টেম লগইন</h1>
          <p className="text-slate-400 text-sm">আপনার ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন</p>
        </header>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">ইমেইল ঠিকানা</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "লগইন হচ্ছে..." : "প্রবেশ করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}