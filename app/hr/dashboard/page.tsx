"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  emp_id?: string;
  name: string;
  email: string;
  designation: string;
  role: string;
  image?: string;
  password?: string;
}

interface DailyRecord {
  id: string;
  user_email: string;
  record_date: string;
  created_at?: string;
  [key: string]: any;
}

export default function HRDashboard() {
  const router = useRouter();
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dailySubmissions, setDailySubmissions] = useState<DailyRecord[]>([]);
  const [todaySubmissionsCount, setTodaySubmissionsCount] = useState<number>(0);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Search states
  const [directorySearch, setDirectorySearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");

  // Notice states for HR
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Modal states for view/edit
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    emp_id: "",
    name: "",
    email: "",
    designation: "",
    role: "employee",
    image: "",
    password: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: empData, count, error: empError } = await supabase
        .from("employees")
        .select("*", { count: "exact" })
        .order("name", { ascending: true });

      if (!empError && empData) {
        setEmployees(empData);
        if (count !== null) setEmployeeCount(count);
      }

      const todayStr = new Date().toISOString().split("T")[0];

      const { count: attCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", todayStr);

      if (attCount !== null) {
        setTodayAttendanceCount(attCount);
      }

      const { data: recordData, error: recordError } = await supabase
        .from("daily_amal_records")
        .select("*")
        .order("record_date", { ascending: false })
        .limit(50);

      if (!recordError && recordData) {
        setDailySubmissions(recordData);
      }

      const { count: taskCount } = await supabase
        .from("daily_amal_records")
        .select("*", { count: "exact", head: true })
        .eq("record_date", todayStr);

      if (taskCount !== null) {
        setTodaySubmissionsCount(taskCount);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    setIsPosting(true);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    try {
      const { error } = await supabase.from("announcements").insert([
        { title: noticeTitle, content: noticeContent, date: dateStr }
      ]);

      if (error) {
        alert("নোটিশ পোস্ট করতে সমস্যা হয়েছে: " + error.message);
      } else {
        alert("সফলভাবে কোম্পানির নোটিশ পোস্ট করা হয়েছে!");
        setNoticeTitle("");
        setNoticeContent("");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি সত্যিই ${name}-কে ডিলিট করতে চান?`)) {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) {
        alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
      } else {
        setEmployees(employees.filter((emp) => emp.id !== id));
        setEmployeeCount((prev) => prev - 1);
        alert("Employee সফলভাবে ডিলিট করা হয়েছে।");
      }
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFormData({
      emp_id: emp.emp_id || "",
      name: emp.name,
      email: emp.email || "",
      designation: emp.designation || "",
      role: emp.role || "employee",
      image: emp.image || "",
      password: emp.password || "",
    });
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setUploading(true);
    let imageUrl = editFormData.image;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("employee-avatars")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          console.warn("Storage upload warning:", uploadError.message);
        } else {
          const { data: publicURLData } = supabase.storage
            .from("employee-avatars")
            .getPublicUrl(filePath);
          imageUrl = publicURLData.publicUrl;
        }
      }

      const updateData: any = {
        emp_id: editFormData.emp_id,
        name: editFormData.name,
        email: editFormData.email,
        designation: editFormData.designation,
        role: editFormData.role,
        image: imageUrl,
      };

      if (editFormData.password && editFormData.password.trim() !== "") {
        updateData.password = editFormData.password;
      }

      const { error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", selectedEmployee.id);

      if (error) {
        alert("Update করতে সমস্যা হয়েছে: " + error.message);
      } else {
        alert("Employee-এর তথ্য সফলভাবে আপডেট হয়েছে!");
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getEmployeeByEmail = (email: string) => {
    return employees.find(emp => emp.email?.toLowerCase() === email?.toLowerCase());
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = directorySearch.trim().toLowerCase();
    if (!q) return true;
    const searchEmpId = q.startsWith("emp-") ? q : `emp-${q}`;
    return (
      (emp.emp_id && emp.emp_id.toLowerCase().includes(q)) ||
      (emp.emp_id && emp.emp_id.toLowerCase().includes(searchEmpId)) ||
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  const filteredSubmissions = dailySubmissions.filter((sub) => {
    const q = submissionSearch.trim().toLowerCase();
    if (!q) return true;
    const emp = getEmployeeByEmail(sub.user_email);
    const empId = emp?.emp_id ? emp.emp_id.toLowerCase() : "";
    const searchEmpId = q.startsWith("emp-") ? q : `emp-${q}`;
    const empName = emp?.name ? emp.name.toLowerCase() : "";

    return (
      empId.includes(q) ||
      empId.includes(searchEmpId) ||
      sub.user_email.toLowerCase().includes(q) ||
      empName.includes(q)
    );
  });

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="border-b border-slate-800/85 pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          HR Dashboard Overview
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Welcome back! Here is what's happening across your team today.
        </p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#0b111e] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Employees
              </p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {loading ? "..." : employeeCount}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">👥</div>
          </div>
          <p className="text-xs text-emerald-400 mt-4 font-medium">
            <span>↑ Active Portal Users</span>
          </p>
        </div>

        <div className="bg-[#0b111e] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Today's Tasks
              </p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {loading ? "..." : todaySubmissionsCount}
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">📋</div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Updated live from database</p>
        </div>

        <Link 
          href="/hr/attendance"
          className="bg-[#0b111e] border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-6 relative overflow-hidden group transition block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Today's Attendance
              </p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-2">
                {loading ? "..." : `${todayAttendanceCount} Present`}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">⏱️</div>
          </div>
          <p className="text-xs text-emerald-400 mt-4 font-medium flex items-center gap-1 group-hover:underline">
            <span>হাজিরা মনিটর করুন →</span>
          </p>
        </Link>

        <div className="bg-[#0b111e] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending Requests
              </p>
              <h3 className="text-3xl font-bold text-white mt-2">0</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">⏳</div>
          </div>
          <p className="text-xs text-slate-400 mt-4">All reviews clear</p>
        </div>
      </div>

      {/* Publish Company Notice */}
      <div className="bg-[#0b111e] border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl text-lg">📢</span>
          <div>
            <h2 className="text-lg font-bold text-white">Publish Company Notice</h2>
            <p className="text-xs text-slate-400">এখানে নোটিশ পোস্ট করলে তা সকল কর্মীর ড্যাশবোর্ডে লাইভ দেখাবে।</p>
          </div>
        </div>
        
        <form onSubmit={handlePostNotice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Notice Title</label>
              <input
                type="text"
                placeholder="যেমন: নতুন অফিস সময়সূচী..."
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                required
                className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Publish Date (Auto)</label>
              <input
                type="text"
                value="আজকের তারিখ অনুযায়ী স্বয়ংক্রিয়ভাবে যুক্ত হবে"
                disabled
                className="w-full bg-[#070b14]/50 border border-slate-800/60 rounded-2xl px-4 py-3 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Notice Details / Content</label>
            <textarea
              placeholder="নোটিশের বিস্তারিত বিবরণ এখানে লিখুন..."
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              required
              rows={3}
              className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPosting}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-2xl transition shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isPosting ? "পোস্ট হচ্ছে..." : "📢 নোটিশ পাবলিশ করুন"}
            </button>
          </div>
        </form>
      </div>

      {/* Employee Daily Amal / Task Submissions Report Section with Search */}
      <div className="bg-[#0b111e] border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Daily Amal & Task Submissions</h2>
            <p className="text-xs text-slate-400">
              Review reports and checklist updates submitted by employees daily.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-64">
              <span className="absolute left-3 text-slate-400 text-xs font-mono font-bold select-none">EMP-</span>
              <input 
                type="text" 
                placeholder="Search by EMP ID..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="bg-[#070b14] border border-slate-800 rounded-xl pl-13 pr-3 py-2 text-white text-xs outline-none w-full focus:border-blue-500 font-mono"
              />
            </div>
            
            <Link
              href="/hr/daily-tasks"
              className="text-xs text-blue-400 hover:underline font-semibold whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">EMP ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Record Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Loading submissions...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No matching task submissions found.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const emp = getEmployeeByEmail(sub.user_email);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-semibold text-white">
                        {emp ? emp.name : sub.user_email}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-400 font-semibold">
                        {emp?.emp_id ? emp.emp_id : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{sub.user_email}</td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-400">{sub.record_date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Submitted & Saved
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Directory List Section with Search */}
      <div className="bg-[#0b111e] border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Employee Directory</h2>
            <p className="text-xs text-slate-400">
              Manage and view all registered team members, their images, EMP IDs, and actions.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-64">
              <span className="absolute left-3 text-slate-400 text-xs font-mono font-bold select-none">EMP-</span>
              <input 
                type="text" 
                placeholder="Search by EMP ID..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="bg-[#070b14] border border-slate-800 rounded-xl pl-13 pr-3 py-2 text-white text-xs outline-none w-full focus:border-blue-500 font-mono"
              />
            </div>
            
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-2 rounded-xl font-medium whitespace-nowrap">
              Total: {filteredEmployees.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">EMP ID</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      {emp.image && emp.image.trim() !== "" ? (
                        <img
                          src={emp.image}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-xs uppercase shadow-sm">
                          {emp.name ? emp.name.charAt(0) : "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{emp.name}</p>
                        <p className="text-xs text-slate-400 md:hidden">{emp.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-400 font-semibold">
                      {emp.emp_id ? emp.emp_id : `#${emp.id ? String(emp.id).slice(0, 8).toUpperCase() : "N/A"}`}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {emp.designation || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-semibold uppercase tracking-wider ${
                          emp.role === "hr" || emp.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {emp.role || "employee"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{emp.email}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsViewModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Employee Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center space-y-3">
              {selectedEmployee.image && selectedEmployee.image.trim() !== "" ? (
                <img
                  src={selectedEmployee.image}
                  alt={selectedEmployee.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/40 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xl flex items-center justify-center border-2 border-blue-500/40 uppercase">
                  {selectedEmployee.name.charAt(0)}
                </div>
              )}
              <h4 className="text-xl font-bold text-white">{selectedEmployee.name}</h4>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase font-semibold">
                {selectedEmployee.role || "employee"}
              </span>
            </div>
            <div className="space-y-3 bg-[#070b14] border border-slate-800 p-4 rounded-2xl text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">EMP ID:</span>
                <span className="font-mono text-xs text-blue-400">{selectedEmployee.emp_id || `#${selectedEmployee.id.slice(0, 8).toUpperCase()}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{selectedEmployee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Designation:</span>
                <span className="text-slate-200">{selectedEmployee.designation || "N/A"}</span>
              </div>
            </div>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Edit Employee Info & ID</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">EMP ID (e.g. EMP-1001)</label>
                <input
                  type="text"
                  value={editFormData.emp_id}
                  onChange={(e) => setEditFormData({ ...editFormData, emp_id: e.target.value })}
                  placeholder="EMP-1001"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password (Optional / New)</label>
                <input
                  type="text"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Enter new password to change"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Designation</label>
                <input
                  type="text"
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  required
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Employee Image Upload</label>
                <div className="flex items-center gap-4 mb-3">
                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="New Preview"
                      className="w-14 h-14 rounded-full object-cover border border-blue-500 shadow-sm"
                    />
                  ) : editFormData.image && editFormData.image.trim() !== "" ? (
                    <img
                      src={editFormData.image}
                      alt="Current"
                      className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-sm uppercase">
                      {editFormData.name ? editFormData.name.charAt(0) : "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Upload a new image file from your device.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}