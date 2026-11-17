"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const router = useRouter();

  // ১. সাধারণ লগইন হ্যান্ডলার (রোল অনুযায়ী রিডাইরেক্টসহ)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        localStorage.setItem("employee_email", email);

        // employees টেবিল থেকে ইউজারের রোল চেক করা
        const { data: empData } = await supabase
          .from("employees")
          .select("role")
          .eq("email", email)
          .single();

        if (empData?.role === "hr" || empData?.role === "admin") {
          window.location.href = "/hr/dashboard";
        } else {
          window.location.href = "/employee/dashboard";
        }
      }
    } catch (err: any) {
      setErrorMsg("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // ২. অ্যাকাউন্টকে জোরপূর্বক Admin বানানোর সহজ সমাধান (Quick Fix)
  const makeMeAdmin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      let { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setErrorMsg("আগে সঠিক Email ও Password দিয়ে ফর্মটি পূরণ করুন!");
          setLoading(false);
          return;
        }
        
        const refreshedUser = await supabase.auth.getUser();
        user = refreshedUser.data.user;
      }

      if (user) {
        // Auth মেটাডেটাতে রোল আপডেট
        await supabase.auth.updateUser({
          data: { role: "admin" },
        });

        // employees টেবিলেও রোল আপডেট করে দেওয়া যাতে ড্যাশবোর্ডে পারমিশন পেতে সমস্যা না হয়
        await supabase
          .from("employees")
          .update({ role: "hr" })
          .eq("email", email);

        alert("🎉 সফল হয়েছে! আপনার অ্যাকাউন্টটি এখন ADMIN/HR। ড্যাশবোর্ডে রিডাইরেক্ট হচ্ছে...");
        localStorage.setItem("employee_email", email);
        window.location.href = "/hr/dashboard";
      }
    } catch (err: any) {
      setErrorMsg("কোনো একটি এরর হয়েছে: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-3 shadow-lg shadow-blue-600/30">
            HR
          </div>
          <h1 className="text-2xl font-extrabold text-white">HR Portal Login</h1>
          <p className="text-slate-400 text-sm mt-1">আপনার ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "অপেক্ষা করুন..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase">Or Fix Access</span>
        </div>

        {/* ⚡ Quick Fix Button */}
        <button
          type="button"
          onClick={makeMeAdmin}
          disabled={loading}
          className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold rounded-xl text-sm border border-purple-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⚡</span> Make Me Admin (Quick Fix)
        </button>
      </div>
    </div>
  );
}