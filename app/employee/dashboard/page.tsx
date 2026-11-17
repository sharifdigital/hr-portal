"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Employee {
  name: string;
  image: string;
  emp_id: string;
}

interface AttendanceRecord {
  date: string;
  check_in: string | null;
  check_out: string | null;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function ProfessionalEmployeeDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Attendance States
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  // Notice State
  const [notices, setNotices] = useState<Notice[]>([]);

  // Safe Date initializations inside useEffect
  const [todayDate, setTodayDate] = useState("");
  const [formattedDisplayDate, setFormattedDisplayDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const dbStr = `${year}-${month}-${day}`;
    const displayStr = `${day}/${month}/${year}`;

    setTodayDate(dbStr);
    setFormattedDisplayDate(displayStr);

    async function getEmployeeData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let empEmail = user?.email;

        if (!empEmail && typeof window !== "undefined") {
          empEmail = localStorage.getItem("employee_email") || "";
        }

        if (empEmail) {
          const cleanEmail = empEmail.trim().toLowerCase();

          const { data, error } = await supabase
            .from("employees")
            .select("name, image, emp_id, email")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (error) console.error("Supabase Error:", error.message);

          if (data) {
            const empData = {
              name: data.name || cleanEmail.split("@")[0],
              image: data.image || "",
              emp_id: data.emp_id ? data.emp_id.split(" ")[0] : "EMP-N/A",
            };
            setEmployee(empData);
            
            // আজকের হাজিরা এবং অতীতের রেকর্ড লোড করা
            fetchTodayAttendance(empData.emp_id, dbStr);
            fetchAttendanceHistory(empData.emp_id);
          } else {
            setEmployee({
              name: cleanEmail.split("@")[0],
              image: "",
              emp_id: "EMP-N/A",
            });
          }
        } else {
          setEmployee({
            name: "Team Member",
            image: "",
            emp_id: "EMP-N/A",
          });
        }

        // নোটিশ বোর্ড লোড করা
        fetchNotices();

      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setLoading(false);
      }
    }

    getEmployeeData();
  }, []);

  // আজকের হাজিরা লোড
  const fetchTodayAttendance = async (empId: string, dateStr: string) => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select("date, check_in, check_out")
        .eq("emp_id", empId)
        .eq("date", dateStr)
        .maybeSingle();

      if (data) {
        setTodayAttendance(data);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
    }
  };

  // মাসিক হাজিরা রেকর্ড লোড
  const fetchAttendanceHistory = async (empId: string) => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select("date, check_in, check_out")
        .eq("emp_id", empId)
        .order("date", { ascending: false })
        .limit(10);

      if (data) {
        setAttendanceHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // নোটিশ লোড (যদি ডাটাবেসে টেবিল না থাকে তবে ডিফল্ট ডামি নোটিশ দেখাবে)
  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        setNotices(data);
      } else {
        // ফালব্যাক হিসেবে উদাহরণ নোটিশ
        setNotices([
          {
            id: "1",
            title: "নতুন অফিস সময়সূচী ও নিয়মাবলী",
            content: "সকল কর্মচারীকে সকাল ৯:০০ টার মধ্যে চেক-ইন করার জন্য অনুরোধ করা হচ্ছে।",
            date: formattedDisplayDate || "আজ",
          },
          {
            id: "2",
            title: "দৈনিক আমল শিট আপডেট সংক্রান্ত",
            content: "প্রতিদিনের কাজ সম্পন্ন করে বিকাল ৫:০০ টার আগে আমল শিট ফিল-আপ করুন।",
            date: formattedDisplayDate || "আজ",
          }
        ]);
      }
    } catch (err) {
      console.error("Notice fetch error:", err);
    }
  };

  const handleAttendance = async (type: "in" | "out") => {
    if (!employee || employee.emp_id === "EMP-N/A" || !todayDate) return;

    setAttLoading(true);
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    try {
      if (type === "in") {
        const { error } = await supabase.from("attendance").upsert({
          emp_id: employee.emp_id,
          employee_name: employee.name,
          date: todayDate,
          check_in: currentTime,
        });

        if (!error) {
          setTodayAttendance((prev) => ({
            date: todayDate,
            check_in: currentTime,
            check_out: prev?.check_out || null,
          }));
          fetchAttendanceHistory(employee.emp_id);
        }
      } else if (type === "out") {
        const { error } = await supabase
          .from("attendance")
          .update({ check_out: currentTime })
          .eq("emp_id", employee.emp_id)
          .eq("date", todayDate);

        if (!error) {
          setTodayAttendance((prev) => ({
            date: todayDate,
            check_in: prev?.check_in || null,
            check_out: currentTime,
          }));
          fetchAttendanceHistory(employee.emp_id);
        }
      }
    } catch (err) {
      console.error("Attendance update error:", err);
    } finally {
      setAttLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("employee_email");
    }
    router.push("/");
    router.refresh();
  };

  // তারিখ DD/MM/YYYY ফরম্যাটে কনভার্ট করার হেল্পার
  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row">
      
      {/* 1. Vertical Sidebar / Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-[#0b111e] border-r border-slate-800/85 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/30">
              E
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm tracking-wide">Employee Portal</h2>
              <p className="text-[10px] text-slate-400 font-mono">WORKSPACE</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link
              href="/employee/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold text-xs transition"
            >
              <span>📊</span> ড্যাশবোর্ড (Dashboard)
            </Link>
            <Link
              href="/employee/daily-amal"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-white font-semibold text-xs transition"
            >
              <span>📋</span> ডেইলি আমল শিট
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          {/* Date Display (DD/MM/YYYY) */}
          <div className="px-3 py-2 bg-[#070b14] rounded-xl border border-slate-800 text-center font-mono text-xs text-slate-300">
            📅 {formattedDisplayDate}
          </div>

          <div className="flex items-center gap-3 p-2 bg-[#070b14] rounded-2xl border border-slate-800">
            {employee?.image && !imageError ? (
              <img 
                src={employee.image} 
                alt={employee.name} 
                className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold uppercase">
                {employee?.name ? employee.name.charAt(0) : "E"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{employee?.name}</p>
              <p className="text-[10px] text-blue-400 font-mono">{employee?.emp_id}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        
        {/* Top Header Section */}
        <div className="bg-[#0b111e] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {employee?.image && !imageError ? (
              <img 
                src={employee.image} 
                alt={employee.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-black uppercase shadow-md">
                {employee?.name ? employee.name.charAt(0) : "E"}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {employee?.name || "এমপ্লয়ী ড্যাশবোর্ড"}
              </h1>
              <p className="text-slate-400 text-xs md:text-sm">
                আপনার পোর্টালে স্বাগতম। • <span className="font-mono text-blue-400 font-bold">{employee?.emp_id}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-red-600/10 to-rose-600/10 hover:from-red-600/25 hover:to-rose-600/25 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold text-xs rounded-2xl transition-all duration-300 shadow-lg shadow-red-950/20 cursor-pointer active:scale-95"
          >
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>লগআউট (Logout)</span>
          </button>
        </div>

        {/* Dashboard Top Cards Grid (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Daily Attendance Card */}
          <div className="bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Today's Attendance</h2>
                <p className="text-slate-400 text-xs mt-1">
                  আজকের ইন এবং আউট সময়। তারিখ: <span className="font-mono text-indigo-400 font-bold">{formattedDisplayDate}</span>
                </p>
              </div>

              {/* Time Display Status */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="bg-[#070b14] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">ইন (In):</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {todayAttendance?.check_in || "--:--"}
                  </span>
                </div>
                <div className="bg-[#070b14] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">আউট (Out):</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {todayAttendance?.check_out || "--:--"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              {!todayAttendance?.check_in ? (
                <button
                  disabled={attLoading}
                  onClick={() => handleAttendance("in")}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {attLoading ? "রেকর্ড হচ্ছে..." : "চেক ইন করুন (Check In) →"}
                </button>
              ) : !todayAttendance?.check_out ? (
                <button
                  disabled={attLoading}
                  onClick={() => handleAttendance("out")}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {attLoading ? "রেকর্ড হচ্ছে..." : "চেক আউট করুন (Check Out) →"}
                </button>
              ) : (
                <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-2xl text-center">
                  ✓ আজকের হাজিরা সম্পন্ন হয়েছে
                </div>
              )}
            </div>
          </div>

          {/* Daily Amal Card */}
          <div className="bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                ✓
              </div>
              <h2 className="text-lg font-bold text-white">Daily Practices & Tasks</h2>
              <p className="text-slate-400 text-xs">
                প্রতিদিনের নামাজ, জিকির এবং অন্যান্য নির্ধারিত আমল বা কাজের স্ট্যাটাস আপডেট করুন।
              </p>
            </div>
            
            <div className="pt-4">
              <Link 
                href="/employee/daily-amal" 
                className="inline-flex items-center justify-center w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-blue-600/20"
              >
                আমল শিট খুলুন →
              </Link>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                ●
              </div>
              <h2 className="text-lg font-bold text-white">অ্যাকাউন্ট স্ট্যাটাস</h2>
              <p className="text-slate-400 text-xs">
                আপনার অ্যাকাউন্টটি বর্তমানে এমপ্লয়ী পোর্টালে সক্রিয় রয়েছে এবং ডেটা সুরক্ষিতভাবে সিঙ্ক হচ্ছে।
              </p>
            </div>

            <div className="pt-4">
              <div className="bg-[#070b14] border border-slate-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs text-slate-300">
                <span>স্ট্যাটাস:</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-lg">সক্রিয় (Active)</span>
              </div>
            </div>
          </div>

        </div>

        {/* 🌟 New Section Grid: 1. Monthly Attendance History & 2. Company Notice Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* 🌟 1. Monthly Attendance History */}
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-lg">🗓️</span>
                <div>
                  <h2 className="text-base font-bold text-white">Attendance History</h2>
                  <p className="text-xs text-slate-400">বিগত দিনগুলোর হাজিরার রেকর্ড (DD/MM/YYYY)</p>
                </div>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                Recent 10 Days
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">ইন (Check-In)</th>
                    <th className="py-2.5 px-3">আউট (Check-Out)</th>
                    <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        কোনো হাজিরার রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition font-mono">
                        <td className="py-2.5 px-3 text-slate-200 font-bold">
                          {formatDateToDMY(item.date)}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400">
                          {item.check_in || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-rose-400">
                          {item.check_out || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Present
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🌟 2. Company Notice Board / Announcements */}
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl text-lg">📢</span>
                  <div>
                    <h2 className="text-base font-bold text-white">Company Notice Board</h2>
                    <p className="text-xs text-slate-400">অফিসের সাম্প্রতিক নোটিশ ও গুরুত্বপূর্ণ ঘোষণা</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {notices.map((notice) => (
                  <div key={notice.id} className="bg-[#070b14] border border-slate-800/80 p-4 rounded-2xl space-y-1 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                        <span>📌</span> {notice.title}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">{notice.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-5">
                      {notice.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 text-center">
              <span className="text-[11px] text-slate-500">
                জরুরি প্রয়োজনে আপনার HR টিমের সাথে যোগাযোগ করুন।
              </span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}