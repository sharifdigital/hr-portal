"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/AdminGuard";

export default function NewEmployeePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState(""); // ম্যানুয়াল টেক্সট ইনপুট স্টেট
  const [password, setPassword] = useState("");
  
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nid, setNid] = useState("");
  
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const [gender, setGender] = useState("Male");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let avatarUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("employee-avatars")
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("employee-avatars")
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      let formattedDob = null;
      if (birthYear && birthMonth && birthDay) {
        formattedDob = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "employee",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user auth!");

      const userId = authData.user.id;

      const { error: dbError } = await supabase.from("employees").upsert(
        [
          {
            id: userId,
            name: fullName,
            email: email,
            designation: designation,
            department: department,
            avatar_url: avatarUrl,
            phone_number: phone,
            blood_group: bloodGroup,
            nid_number: nid,
            date_of_birth: formattedDob,
            gender: gender,
            present_address: presentAddress,
            permanent_address: permanentAddress,
            role: "employee",
          },
        ],
        { onConflict: "id" }
      );

      if (dbError) {
        console.error("DB Upsert Error:", dbError);
        throw new Error("Auth created, but failed to save in employees table: " + dbError.message);
      }

      alert("Employee created and saved successfully!");
      router.push("/hr/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create employee!");
    } finally {
      setLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { name: "January", value: "01" },
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
    { name: "June", value: "06" },
    { name: "July", value: "07" },
    { name: "August", value: "08" },
    { name: "September", value: "09" },
    { name: "October", value: "10" },
    { name: "November", value: "11" },
    { name: "December", value: "12" },
  ];

  const fixedCurrentYear = 2026;
  const years = Array.from({ length: 70 }, (_, i) => fixedCurrentYear - i);

  return (
    <AdminGuard>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white">➕ Add New Employee</h1>
          <p className="text-slate-400 text-sm mt-1">Create an account and save directly to database</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 mb-3 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs mb-3 font-bold border border-slate-700">PHOTO</div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahim Ahmed" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahim@company.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Designation</label>
              <input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Software Engineer" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              {/* ✏️ টেক্সট ইনপুট ফিল্ড হিসেবে আপডেট করা ডিপার্টমেন্ট অপশন */}
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Department</label>
              <input type="text" required value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. IT, HR, Sales" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Temporary Password</label>
              <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017xxxxxxxx" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition">
                <option value="">Select Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">NID Number</label>
              <input type="text" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="NID Number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date of Birth (Day / Month / Year)</label>
            <div className="grid grid-cols-3 gap-3">
              <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition">
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d < 10 ? `0${d}` : d}>{d}</option>
                ))}
              </select>

              <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition">
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>

              <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition">
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Present Address</label>
            <textarea rows={2} value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} placeholder="Present address details..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Permanent Address</label>
            <textarea rows={2} value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} placeholder="Permanent address details..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none transition" />
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => router.push("/hr/dashboard")} className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20">
              {loading ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}