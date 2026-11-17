"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Error fetching employee: " + error.message);
    } else if (data) {
      setEmployeeId(data.employee_id || "");
      setName(data.name || "");
      setEmail(data.email || "");
      setDesignation(data.designation || "");
      setPhone(data.phone || "");
      setBloodGroup(data.blood_group || "");
      setNidNumber(data.nid_number || "");
      setGender(data.gender || "Male");
      setDateOfBirth(data.date_of_birth || "");
      setPresentAddress(data.present_address || "");
      setPermanentAddress(data.permanent_address || "");
      setAvatarUrl(data.avatar_url || "");
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    const { error } = await supabase
      .from("employees")
      .update({
        employee_id: employeeId,
        name,
        email,
        designation,
        phone,
        blood_group: bloodGroup,
        nid_number: nidNumber,
        gender,
        date_of_birth: dateOfBirth,
        present_address: presentAddress,
        permanent_address: permanentAddress,
        avatar_url: avatarUrl,
      })
      .eq("id", id);

    if (error) {
      alert("Failed to update: " + error.message);
      setUpdating(false);
    } else {
      alert("Employee information updated successfully!");
      router.push("/hr/dashboard");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 p-8 flex items-center justify-center">
        <p className="text-slate-400 font-medium">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      <div className="flex items-center justify-between bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Edit Employee Information</h1>
          <p className="text-slate-400 text-sm mt-1">Update all records and profile details.</p>
        </div>
        <Link href="/hr/dashboard">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer">
            Back to Dashboard
          </button>
        </Link>
      </div>

      <form onSubmit={handleUpdate} className="bg-[#0b111e] border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Photo URL</label>
          <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Employee ID</label>
            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-001" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Designation / Role</label>
            <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Software Engineer" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017xxxxxxxx" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Blood Group</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none cursor-pointer">
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">NID Number</label>
            <input type="text" value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="NID Number" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none cursor-pointer">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Present Address</label>
          <textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} rows={3} placeholder="Present Address" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none resize-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Permanent Address</label>
          <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={3} placeholder="Permanent Address" className="w-full bg-[#070b14] border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none resize-none" />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <Link href="/hr/dashboard">
            <button type="button" className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-2xl transition cursor-pointer">
              Cancel
            </button>
          </Link>
          <button type="submit" disabled={updating} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg cursor-pointer disabled:opacity-50">
            {updating ? "Saving All Changes..." : "Save All Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}