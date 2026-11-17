"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AttendanceItem {
  id: string;
  emp_id: string;
  employee_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  created_at: string;
}

export default function HRAttendanceMonitoring() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");

  // কম্পোনেন্ট মাউন্ট হওয়ার পর ক্লায়েন্ট সাইডে আজকের তারিখ সেট করা হচ্ছে
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  // ডেটা ফেচ ফাংশন
  const fetchAttendance = async (date: string) => {
    if (!date) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching HR attendance:", error.message);
      } else {
        setRecords(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance(selectedDate);
    }
  }, [selectedDate]);

  // সার্চ ফিল্টারিং
  const filteredRecords = records.filter(
    (item) =>
      item.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.emp_id?.toLowerCase().includes(search.toLowerCase())
  );

  // স্ট্যাটাস পরিসংখ্যান
  const totalPresent = records.length;
  const currentlyWorking = records.filter((r) => r.check_in && !r.check_out).length;
  const completedShift = records.filter((r) => r.check_in && r.check_out).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Section with Back Button */}
        <div className="bg-[#0b111e] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          
          {/* Back Button */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <Link
              href="/hr/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>← HR ড্যাশবোর্ডে ফিরে যান</span>
            </Link>

            {/* Quick Refresh Icon Button */}
            <button
              onClick={() => selectedDate && fetchAttendance(selectedDate)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 hover:text-white transition active:scale-95"
              title="রিফ্রেশ করুন"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Title and Date Picker */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                HR Attendance Monitoring Portal
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                কর্মীদের দৈনিক উপস্থিতি, প্রবেশ ও প্রস্থানের সময় লাইভ পর্যবেক্ষণ করুন।
              </p>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-3 bg-[#070b14] border border-slate-800 px-4 py-2 rounded-2xl">
              <span className="text-xs text-slate-400">তারিখ:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0b111e] border border-slate-800 p-5 rounded-2xl">
            <span className="text-slate-400 text-xs font-semibold">আজ মোট উপস্থিত</span>
            <div className="text-2xl font-bold text-white mt-1">{totalPresent} জন</div>
          </div>
          <div className="bg-[#0b111e] border border-slate-800 p-5 rounded-2xl">
            <span className="text-amber-400 text-xs font-semibold">বর্তমানে অফিসে আছেন</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{currentlyWorking} জন</div>
          </div>
          <div className="bg-[#0b111e] border border-slate-800 p-5 rounded-2xl">
            <span className="text-emerald-400 text-xs font-semibold">ডিউটি শেষ করেছেন</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedShift} জন</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="নাম বা EMP ID দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0b111e] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070b14] text-slate-400 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">কর্মীর নাম</th>
                  <th className="py-4 px-6">এমপ্লয়ী আইডি</th>
                  <th className="py-4 px-6">প্রবেশ (Check In)</th>
                  <th className="py-4 px-6">প্রস্থান (Check Out)</th>
                  <th className="py-4 px-6">বর্তমান স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      এই তারিখে কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-6 font-semibold text-white">
                        {item.employee_name || "নাম পাওয়া যায়নি"}
                      </td>
                      <td className="py-4 px-6 font-mono text-blue-400 font-semibold">
                        {item.emp_id}
                      </td>
                      <td className="py-4 px-6 font-mono text-emerald-400">
                        {item.check_in || "--:--"}
                      </td>
                      <td className="py-4 px-6 font-mono text-rose-400">
                        {item.check_out || "--:--"}
                      </td>
                      <td className="py-4 px-6">
                        {item.check_in && !item.check_out ? (
                          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-semibold text-[10px]">
                            ● কর্মস্থলে উপস্থিত
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-semibold text-[10px]">
                            ✓ সম্পন্ন (Out)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}