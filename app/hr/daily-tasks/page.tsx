"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface EmployeeOption {
  email: string;
  name: string;
  emp_id: string;
  image?: string;
  designation?: string;
}

export default function HRDailyTasksMonitor() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [employeeRecord, setEmployeeRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    loadInitialData();
  }, []);

  // ডাটাবেজের সমস্ত এমপ্লয়ী ও তাদের ইমেজ/নামসহ সাবমিশন লোড
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // ১. employees টেবিল থেকে নাম, আইডি এবং ইমেজ আনা
      const { data: empData } = await supabase
        .from("employees")
        .select("email, name, emp_id, image, designation")
        .order("name", { ascending: true });

      // ২. সব সাবমিশন ডাটা আনা
      const { data: recData } = await supabase
        .from("daily_amal_records")
        .select("*")
        .order("record_date", { ascending: false });

      const records = recData || [];
      setAllSubmissions(records);

      const listMap = new Map<string, EmployeeOption>();

      if (empData) {
        empData.forEach((emp) => {
          if (emp.email) {
            listMap.set(emp.email.toLowerCase().trim(), {
              email: emp.email.toLowerCase().trim(),
              name: emp.name || emp.email.split("@")[0],
              emp_id: emp.emp_id ? emp.emp_id.split(" ")[0] : "N/A",
              image: emp.image || "",
              designation: emp.designation || "",
            });
          }
        });
      }

      records.forEach((rec) => {
        const mail = (rec.user_email || rec.email || "").toLowerCase().trim();
        if (mail && !listMap.has(mail)) {
          listMap.set(mail, {
            email: mail,
            name: mail.split("@")[0],
            emp_id: "N/A",
            image: "",
            designation: "",
          });
        }
      });

      const combinedList = Array.from(listMap.values());
      setEmployees(combinedList);

      // ৩. স্বয়ংক্রিয়ভাবে যার সাবমিশন আছে তাকে প্রথমে সিলেক্ট করা
      if (records.length > 0) {
        const latestSubmission = records[0];
        const latestEmail = (latestSubmission.user_email || latestSubmission.email || "").toLowerCase().trim();
        const latestDate = String(latestSubmission.record_date || "").split("T")[0].split(" ")[0];
        
        setSelectedEmail(latestEmail);
        setSelectedDate(latestDate);
        setEmployeeRecord(latestSubmission);
      } else if (combinedList.length > 0) {
        setSelectedEmail(combinedList[0].email);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  // যখন ইউজার বা তারিখ পরিবর্তন হবে
  useEffect(() => {
    setImgError(false); // ইউজার বদলালে ইমেজ এরর রিসেট
    if (!selectedEmail) return;

    const cleanEmail = selectedEmail.trim().toLowerCase();
    const cleanDate = selectedDate.trim();

    const matched = allSubmissions.find((rec) => {
      const recEmail = (rec.user_email || rec.email || "").toLowerCase().trim();
      const recDate = String(rec.record_date || "").trim();
      const isDateMatch = recDate === cleanDate || recDate.startsWith(cleanDate);
      return recEmail === cleanEmail && isDateMatch;
    });

    setEmployeeRecord(matched || null);
  }, [selectedEmail, selectedDate, allSubmissions]);

  // নির্বাচিত কর্মীর কোন কোন তারিখে সাবমিশন আছে
  const datesForSelectedUser = useMemo(() => {
    if (!selectedEmail) return [];
    const cleanEmail = selectedEmail.trim().toLowerCase();
    return allSubmissions
      .filter((r) => (r.user_email || r.email || "").toLowerCase().trim() === cleanEmail)
      .map((r) => String(r.record_date || "").split("T")[0].split(" ")[0])
      .filter(Boolean);
  }, [selectedEmail, allSubmissions]);

  // সম্প্রতি যারা সাবমিট করেছেন তাদের তালিকা
  const recentSubmittingUsers = useMemo(() => {
    const map = new Map<string, { email: string; date: string; name: string; image?: string }>();
    allSubmissions.forEach((r) => {
      const mail = (r.user_email || r.email || "").toLowerCase().trim();
      if (mail && !map.has(mail)) {
        const emp = employees.find((e) => e.email.toLowerCase() === mail);
        map.set(mail, {
          email: mail,
          date: String(r.record_date || "").split("T")[0].split(" ")[0],
          name: emp ? emp.name : mail.split("@")[0],
          image: emp?.image || "",
        });
      }
    });
    return Array.from(map.values()).slice(0, 5);
  }, [allSubmissions, employees]);

  // সার্চ ফিল্টার
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    const cleanQ = q.replace(/^emp-/, "");
    return employees.filter(
      (emp) =>
        emp.emp_id.toLowerCase().includes(cleanQ) ||
        emp.email.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q)
    );
  }, [searchQuery, employees]);

  const currentEmpInfo = employees.find(
    (emp) => emp.email.toLowerCase() === selectedEmail.toLowerCase()
  );

  // সাবমিট করা ভ্যালু চেক
  const checkIsCompleted = (val: any): boolean => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val > 0;
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      return s === "true" || s === "1" || s === "yes" || s === "done" || s === "সম্পন্ন";
    }
    return Boolean(val);
  };

  // সিস্টেম কলাম বাদে আসল টাস্কগুলো ফিল্টার করা
  const taskEntries = useMemo(() => {
    if (!employeeRecord) return [];
    const ignored = ["id", "user_email", "email", "record_date", "created_at", "updated_at"];
    return Object.entries(employeeRecord).filter(([key]) => !ignored.includes(key));
  }, [employeeRecord]);

  const completedCount = useMemo(() => {
    return taskEntries.filter(([_, val]) => checkIsCompleted(val)).length;
  }, [taskEntries]);

  const totalTasks = taskEntries.length || 21;
  const pendingCount = Math.max(0, totalTasks - completedCount);
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const formatTaskName = (key: string) => {
    const labels: { [key: string]: string } = {
      fojor_namaz: "ফজর নামাজ",
      fojor_fateha: "ফজর ফাতিহা শরীফ",
      fojor_kuyate_elahi: "কুয়াতে এলাহী ফায়েজের মোরাকাবা",
      fojor_kotom: "ফজর খতম শরীফ",
      johor_namaz: "যোহর নামাজ",
      johor_wasul: "রাসুল (সা:) মহব্বতের ফায়েজের মোরাকাবা",
      asor_namaz: "আসর নামাজ",
      asor_towba: "তওবা ফায়েজের মোরাকাবা",
      magrib_namaz: "মাগরিব নামাজ",
      magrib_fateha: "মাগরিব ফাতিহা শরীফ",
      magrib_towba: "তওবা কবুলিয়তের ফায়েজের মোরাকাবা",
      magrib_milad: "মাগরিব মিলাদ",
      esha_namaz: "এশা নামাজ",
      esha_faijaten: "গাইরিয়াতের ফায়েজের মোরাকাবা",
      esha_darud: "দরুদ শরীফ",
      esha_towba_path: "তওবা পাঠ (৫০০ বার)",
      rohomot_milad: "রহমত মিলাদ",
      rohomot_faijaten: "রহমতেন ফায়েজের মোরাকাবা",
      mohammadi_islamer_boi: "মোহাম্মাদী ইসলামের বই পাঠ",
      protiti_kaje_morshed: "প্রতিটি কাজে মোর্শেদকে স্মরণ",
      unnayon_bisoyok_porikolpona: "উন্নয়ন বিষয়ক পরিকল্পনা / পরামর্শ",
    };
    return labels[key] || key.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 md:px-8 selection:bg-indigo-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/hr/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b111e] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-2xl border border-slate-800 transition active:scale-95 shadow-md"
          >
            ← HR ড্যাশবোর্ডে ফিরে যান
          </Link>

          <span className="text-xs font-mono text-slate-400 bg-[#0b111e] px-3.5 py-1.5 rounded-xl border border-slate-800">
            মোট সাবমিশন: <span className="text-indigo-400 font-bold">{allSubmissions.length} টি</span>
          </span>
        </div>

        {/* 🌟 কুইক সিলেক্ট বার: সম্প্রতি যারা সাবমিট করেছেন (ইমেজসহ) */}
        {recentSubmittingUsers.length > 0 && (
          <div className="bg-[#0b111e] border border-slate-800/80 p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg print:hidden">
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 shrink-0">
              <span>⚡</span> সম্প্রতি সাবমিট করেছেন:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {recentSubmittingUsers.map((item) => (
                <button
                  key={item.email}
                  onClick={() => {
                    setSelectedEmail(item.email);
                    setSelectedDate(item.date);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-2 ${
                    selectedEmail === item.email
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : "bg-[#070b14] hover:bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>{item.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({item.date})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 text-base">📋</span>
              কর্মচারীর দৈনিক আমল ও কাজের রিপোর্ট
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              কর্মীর নাম সিলেক্ট করুন এবং নির্ধারিত তারিখের কাজের অগ্রগতি দেখুন।
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            {/* Quick EMP Search */}
            <div className="relative flex items-center w-full sm:w-44">
              <span className="absolute left-3.5 text-slate-500 text-xs font-mono font-bold select-none">EMP-</span>
              <input
                type="text"
                placeholder="1001"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#070b14] border border-slate-800 rounded-2xl pl-14 pr-3 py-2.5 text-white text-xs outline-none w-full focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Employee Selector */}
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-xs outline-none cursor-pointer w-full sm:w-auto focus:border-indigo-500"
            >
              {filteredEmployees.length === 0 ? (
                <option value="">কোন কর্মী পাওয়া যায়নি</option>
              ) : (
                filteredEmployees.map((emp) => (
                  <option key={emp.email} value={emp.email}>
                    {emp.emp_id !== "N/A" ? `[${emp.emp_id}] ` : ""}{emp.name} ({emp.email})
                  </option>
                ))
              )}
            </select>

            {/* Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-xs outline-none cursor-pointer [color-scheme:dark] focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Available Dates Warning Bar */}
        {datesForSelectedUser.length > 0 && !employeeRecord && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
            <span className="text-xs text-amber-300 font-semibold">
              ⚠️ {selectedDate} তারিখে ডাটা নেই! তবে এই কর্মী নিচের তারিখে সাবমিট করেছেন:
            </span>
            <div className="flex flex-wrap gap-2">
              {datesForSelectedUser.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  📅 {d} দেখুন ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 Report Overview Section with Profile Image & User Name */}
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-2">
          
          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0e1726] to-indigo-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg print:bg-gray-50 print:border-gray-300 print:p-4">
            
            <div className="space-y-4 print:space-y-2">
              <div className="flex items-center gap-4">
                {/* 🌟 Profile Image / Avatar with Fallback */}
                {currentEmpInfo?.image && !imgError && currentEmpInfo.image.trim() !== "" ? (
                  <img
                    src={currentEmpInfo.image}
                    alt={currentEmpInfo.name}
                    onError={() => setImgError(true)}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-xl shadow-indigo-950/50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-2xl uppercase shadow-md print:hidden">
                    {currentEmpInfo?.name ? currentEmpInfo.name.charAt(0) : "U"}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 🌟 User Name */}
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight print:text-black">
                      {currentEmpInfo?.name || selectedEmail}
                    </h2>
                    
                    {/* EMP ID Badge */}
                    {currentEmpInfo && currentEmpInfo.emp_id !== "N/A" && (
                      <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full font-mono font-bold print:text-black">
                        {currentEmpInfo.emp_id}
                      </span>
                    )}

                    {/* Designation Badge */}
                    {currentEmpInfo?.designation && (
                      <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                        {currentEmpInfo.designation}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 font-mono mt-1 print:text-gray-600">
                    {selectedEmail}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              {employeeRecord && (
                <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-sm print:bg-emerald-50 print:text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    সম্পন্ন: {completedCount} / {totalTasks}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl shadow-sm print:bg-rose-50 print:text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    বাকী: {pendingCount} টি
                  </span>
                  <span className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl font-mono shadow-sm print:bg-gray-100 print:text-black">
                    অগ্রগতি: {completionPercentage}%
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              {employeeRecord && (
                <div className="w-full max-w-md bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-slate-800 print:bg-gray-200">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Date & Print Actions */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <span className="text-xs font-mono text-slate-200 bg-[#070b14]/90 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md print:bg-white print:text-black">
                📅 {selectedDate}
              </span>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-indigo-600/20 print:hidden flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🖨️ প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* Tasks Grid or Empty State */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">রিপোর্ট লোড হচ্ছে...</span>
            </div>
          ) : !employeeRecord ? (
            <div className="text-center py-16 space-y-4 bg-[#070b14]/50 border border-slate-800/80 rounded-2xl print:border-gray-200">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-xl">
                ⏳
              </div>
              <div className="space-y-1">
                <p className="text-slate-300 text-sm font-semibold">
                  এই তারিখে ({selectedDate}) <span className="text-white font-bold">{currentEmpInfo?.name || selectedEmail}</span> কোনো আমল বা কাজের রিপোর্ট সাবমিট করেননি।
                </p>
                <p className="text-slate-500 text-xs">
                  অন্য কোনো কর্মী বা অন্য কোনো তারিখ সিলেক্ট করে চেক করুন।
                </p>
              </div>
              <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-medium">
                Pending Submission
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2 print:gap-1.5">
              {taskEntries.map(([key, value]) => {
                const isCompleted = checkIsCompleted(value);
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
                      isCompleted
                        ? "bg-emerald-950/15 border-emerald-500/35 text-emerald-200 print:bg-emerald-50 print:border-emerald-300 print:text-black print:p-2"
                        : "bg-[#070b14] border-slate-800/80 text-slate-400 print:bg-white print:border-gray-200 print:text-gray-700 print:p-2"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 print:gap-2">
                      <span
                        className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black transition-transform ${
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                            : "bg-slate-900 border border-slate-700/80 text-slate-600 print:bg-gray-100"
                        } print:w-4 print:h-4 print:text-[10px] print:rounded`}
                      >
                        {isCompleted ? "✓" : "×"}
                      </span>
                      <span className="text-xs md:text-sm font-semibold text-slate-200 print:text-black">
                        {formatTaskName(key)}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-xl transition ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-900"
                          : "bg-slate-900/80 text-slate-500 border border-slate-800 print:bg-gray-100 print:text-gray-600"
                      }`}
                    >
                      {isCompleted ? "সম্পন্ন" : "বাকী"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}