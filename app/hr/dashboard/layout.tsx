"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("employee_email");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row">
      
      {/* 📱 1. MOBILE VERSION TOP HEADER & NAVIGATION (শুধুমাত্র মোবাইলে দেখাবে) */}
      <header className="md:hidden bg-[#0b111e] border-b border-slate-800/85 p-4 space-y-3 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              HR
            </div>
            <div>
              <h2 className="font-extrabold text-white text-xs tracking-wide">HR Portal</h2>
              <span className="text-[9px] font-mono text-purple-400 font-semibold">ADMIN ACCOUNT</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-900 hover:bg-red-500/10 text-red-400 font-semibold text-xs rounded-full border border-slate-800 transition"
          >
            🚪 Logout
          </button>
        </div>

        {/* মোবাইলের হরিজন্টাল স্ক্রোলিং নেভিগেশন (Daily Tasks বাদ দেওয়া হয়েছে) */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/hr/dashboard"
            className={`px-3.5 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap transition ${
              isActive("/hr/dashboard")
                ? "bg-blue-600/20 text-blue-400 border border-blue-500 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800"
            }`}
          >
            📊 Dashboard
          </Link>

          <Link
            href="/hr/add-employee"
            className={`px-3.5 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap transition ${
              isActive("/hr/add-employee")
                ? "bg-blue-600/20 text-blue-400 border border-blue-500 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800"
            }`}
          >
            ➕ Add Employee
          </Link>

          <Link
            href="/hr/attendance"
            className={`px-3.5 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap transition ${
              isActive("/hr/attendance")
                ? "bg-blue-600/20 text-blue-400 border border-blue-500 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800"
            }`}
          >
            ⏱️ Attendance
          </Link>
        </nav>
      </header>

      {/* 🌟 2. DESKTOP VERTICAL SIDEBAR (Daily Tasks অপশনটি বাদ দিয়ে আপডেট করা) */}
      <aside className="hidden md:flex w-full md:w-64 bg-[#0b111e] border-r border-slate-800/85 p-6 flex-col justify-between shrink-0 shadow-2xl min-h-screen">
        <div className="space-y-8">
          
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-600/30">
              HR
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm tracking-wide">HR Portal</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-semibold">
                ADMIN ACCOUNT
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            
            <Link
              href="/hr/dashboard"
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                isActive("/hr/dashboard")
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm group-hover:scale-110 transition-transform">📊</span> 
              <span>Dashboard</span>
            </Link>

            <Link
              href="/hr/add-employee"
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                isActive("/hr/add-employee")
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm group-hover:scale-110 transition-transform">➕</span> 
              <span>Add Employee</span>
            </Link>

            <Link
              href="/hr/attendance"
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                isActive("/hr/attendance")
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm group-hover:scale-110 transition-transform">⏱️</span> 
              <span>Attendance</span>
            </Link>

            {/* Monitoring Section Divider */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Monitoring Reports
              </p>
            </div>

            <Link
              href="/hr/attendance"
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                isActive("/hr/attendance-monitor")
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm group-hover:scale-110 transition-transform">⏱️</span> 
              <span>Attendance Monitor</span>
            </Link>

            <Link
              href="/hr/daily-tasks"
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                isActive("/hr/monitor-tasks")
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm group-hover:scale-110 transition-transform">📋</span> 
              <span>Monitor Tasks</span>
            </Link>
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="pt-6 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-slate-900 hover:bg-red-500/15 text-slate-300 hover:text-red-400 font-semibold text-xs rounded-2xl border border-slate-800 hover:border-red-500/30 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}