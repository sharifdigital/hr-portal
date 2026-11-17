"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/AdminGuard";

export default function CreateEmployeePage() {
  const router = useRouter();

  // ফর্ম স্টেটস
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState(""); // 🌟 New
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState(""); // 🌟 New
  const [bloodGroup, setBloodGroup] = useState("");
  const [nid, setNid] = useState("");
  const [dob, setDob] = useState("");
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

      // ১. ছবি আপলোড হ্যান্ডলিং
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("employee-avatars")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          console.warn("Image upload warning:", uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("employee-avatars")
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      // ২. সুপাবেস ডাটাবেজে ইনসার্ট (সকল কলাম সাপোর্টসহ)
      const cleanEmail = email.trim().toLowerCase();
      const cleanEmpId = employeeId.trim();

      const { error: dbError } = await supabase.from("employees").insert([
        {
          // উভয় নামে ফিল্ড পাঠানো হলো যাতে আগের ড্যাশবোর্ডের সাথে কোনো অমিল না হয়
          emp_id: cleanEmpId,
          employee_id: cleanEmpId,
          name: fullName.trim(),
          email: cleanEmail,
          designation: designation.trim(),
          department: department.trim(), // 🌟 New
          phone_number: phone.trim(),
          emergency_contact: emergencyContact.trim(), // 🌟 New
          blood_group: bloodGroup,
          nid_number: nid.trim(),
          date_of_birth: dob || null,
          gender: gender,
          present_address: presentAddress.trim(),
          permanent_address: permanentAddress.trim(),
          image: avatarUrl,
          avatar_url: avatarUrl,
          role: "employee", // ডিফল্ট রোল
        },
      ]);

      if (dbError) throw dbError;

      alert("নতুন কর্মী সফলভাবে যুক্ত করা হয়েছে!");
      router.back();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "কর্মী তৈরি করতে সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="w-full max-w-3xl bg-[#0b111e] border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <span>➕</span> নতুন কর্মী নিবন্ধন (Add Employee)
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                পোর্টালে নতুন টিম মেম্বারের সম্পূর্ণ তথ্য এন্ট্রি করুন
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#070b14] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
            >
              ← ফিরে যান
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Image Upload Area */}
            <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-800 rounded-2xl bg-[#070b14]/50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-lg mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl mb-3 shadow-inner">
                  👤
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-2">পাসপোর্ট সাইজ ছবি নির্বাচন করুন (JPG, PNG)</p>
            </div>

            {/* Row 1: EMP ID & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Employee ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1001"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Department (বিভাগ) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Information Technology / HR"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Row 2: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Md. Shariful Islam"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Row 3: Designation & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Designation (পদবী) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Row 4: Emergency Contact & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Emergency Contact (জরুরি যোগাযোগ)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="018XXXXXXXX (অভিভাবক/আত্মীয়)"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                >
                  <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
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
            </div>

            {/* Row 5: NID, Gender & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  NID Number
                </label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="জাতীয় পরিচয়পত্র নম্বর"
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Gender (লিঙ্গ)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">মহিলা (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Row 6: Addresses (Side-by-side in 2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Present Address (বর্তমান ঠিকানা)
                </label>
                <textarea
                  rows={2}
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  placeholder="বর্তমান বসবাসের ঠিকানা..."
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Permanent Address (স্থায়ী ঠিকানা)
                </label>
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="স্থায়ী ঠিকানা..."
                  className="w-full bg-[#070b14] border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-1/2 py-3 bg-[#070b14] hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl text-xs md:text-sm transition border border-slate-800 cursor-pointer active:scale-95"
              >
                বাতিল (Cancel)
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-xs md:text-sm transition disabled:opacity-50 shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  "কর্মীর তথ্য সংরক্ষণ করুন ✓"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminGuard>
  );
}