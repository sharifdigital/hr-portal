"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/AdminGuard";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nid, setNid] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErrorMsg("Failed to load employee data: " + error.message);
    } else if (data) {
      setFullName(data.name || "");
      setEmail(data.email || "");
      setDesignation(data.designation || "");
      setPhone(data.phone_number || "");
      setBloodGroup(data.blood_group || "");
      setNid(data.nid_number || "");
      setDob(data.date_of_birth || "");
      setGender(data.gender || "Male");
      setPresentAddress(data.present_address || "");
      setPermanentAddress(data.permanent_address || "");
      if (data.avatar_url) {
        setPreviewUrl(data.avatar_url);
      }
    }
    setFetching(false);
  };

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
      let avatarUrl = previewUrl;

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

      const { error: dbError } = await supabase
        .from("employees")
        .update({
          name: fullName,
          designation: designation,
          avatar_url: avatarUrl,
          phone_number: phone,
          blood_group: bloodGroup,
          nid_number: nid,
          date_of_birth: dob || null,
          gender: gender,
          present_address: presentAddress,
          permanent_address: permanentAddress,
        })
        .eq("id", id);

      if (dbError) throw dbError;

      alert("Employee updated successfully!");
      router.push(`/hr/employees/${id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update employee!");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <p className="text-slate-400">Loading employee data...</p>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">✏️ Edit Employee Information</h1>
            <p className="text-slate-400 text-sm mt-1">Update complete details for this team member</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 mb-2" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs mb-2 font-bold">PHOTO</div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address (Read-only)</label>
                <input type="email" disabled value={email} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Designation</label>
                <input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017xxxxxxxx" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Blood Group</label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none">
                  <option value="">Select</option>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">NID Number</label>
                <input type="text" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="NID Number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Present Address</label>
              <textarea rows={2} value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Permanent Address</label>
              <textarea rows={2} value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push(`/hr/employees/${id}`)} className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
                {loading ? "Updating..." : "Update Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}