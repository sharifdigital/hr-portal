"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EmployeeDailyAmalPage() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const [tasks, setTasks] = useState({
    fojor_namaz: false,
    fojor_fateha: false,
    fojor_kuyate_elahi: false,
    fojor_kotom: false,
    johor_namaz: false,
    johor_wasul: false,
    asor_namaz: false,
    asor_towba: false,
    magrib_namaz: false,
    magrib_fateha: false,
    magrib_towba: false,
    magrib_milad: false,
    esha_namaz: false,
    esha_faijaten: false,
    esha_darud: false,
    esha_towba_path: false,
    rohomot_milad: false,
    rohomot_faijaten: false,
    mohammadi_islamer_boi: false,
    protiti_kaje_morshed: false,
    unnayon_bisoyok_porikolpona: false,
  });

  // পেজ লোড হওয়ার সাথে সাথে আজকের তারিখ সেট করা হচ্ছে
  useEffect(() => {
    const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const todayStr = `${year}-${month}-${day}`;
    setSelectedDate(todayStr);
  }, []);

  // যখনই selectedDate পরিবর্তন হবে, সাথে সাথে ঐ তারিখের রেকর্ড ফেচ হবে
  useEffect(() => {
    if (selectedDate) {
      fetchRecord(selectedDate);
    }
  }, [selectedDate]);

  const fetchRecord = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("daily_amal_records")
      .select("*")
      .eq("user_email", user.email)
      .eq("record_date", date)
      .maybeSingle(); // single এর বদলে maybeSingle ব্যবহার করা হয়েছে যাতে রেকর্ড না থাকলে ক্র্যাশ না করে

    if (data) {
      setTasks({
        fojor_namaz: data.fojor_namaz || false,
        fojor_fateha: data.fojor_fateha || false,
        fojor_kuyate_elahi: data.fojor_kuyate_elahi || false,
        fojor_kotom: data.fojor_kotom || false,
        johor_namaz: data.johor_namaz || false,
        johor_wasul: data.johor_wasul || false,
        asor_namaz: data.asor_namaz || false,
        asor_towba: data.asor_towba || false,
        magrib_namaz: data.magrib_namaz || false,
        magrib_fateha: data.magrib_fateha || false,
        magrib_towba: data.magrib_towba || false,
        magrib_milad: data.magrib_milad || false,
        esha_namaz: data.esha_namaz || false,
        esha_faijaten: data.esha_faijaten || false,
        esha_darud: data.esha_darud || false,
        esha_towba_path: data.esha_towba_path || false,
        rohomot_milad: data.rohomot_milad || false,
        rohomot_faijaten: data.rohomot_faijaten || false,
        mohammadi_islamer_boi: data.mohammadi_islamer_boi || false,
        protiti_kaje_morshed: data.protiti_kaje_morshed || false,
        unnayon_bisoyok_porikolpona: data.unnayon_bisoyok_porikolpona || false,
      });
    } else {
      // যদি ঐ তারিখের কোনো রেকর্ড ডাটাবেজে না থাকে, তবে সব আনচেকড দেখাবে
      setTasks({
        fojor_namaz: false,
        fojor_fateha: false,
        fojor_kuyate_elahi: false,
        fojor_kotom: false,
        johor_namaz: false,
        johor_wasul: false,
        asor_namaz: false,
        asor_towba: false,
        magrib_namaz: false,
        magrib_fateha: false,
        magrib_towba: false,
        magrib_milad: false,
        esha_namaz: false,
        esha_faijaten: false,
        esha_darud: false,
        esha_towba_path: false,
        rohomot_milad: false,
        rohomot_faijaten: false,
        mohammadi_islamer_boi: false,
        protiti_kaje_morshed: false,
        unnayon_bisoyok_porikolpona: false,
      });
    }
  };

  const handleCheckboxChange = (key: string) => {
    setTasks((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      alert("দয়া করে তারিখ সিলেক্ট করুন!");
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("দয়া করে আগে লগইন করুন!");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("daily_amal_records")
      .select("id")
      .eq("user_email", user.email)
      .eq("record_date", selectedDate)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("daily_amal_records")
        .update(tasks)
        .eq("id", existing.id);

      if (error) alert("আপডেট করতে সমস্যা হয়েছে: " + error.message);
      else alert("দৈনিক আমল সফলভাবে আপডেট করা হয়েছে!");
    } else {
      const { error } = await supabase
        .from("daily_amal_records")
        .insert([{ ...tasks, user_email: user.email, record_date: selectedDate }]);

      if (error) alert("সংরক্ষণ করতে সমস্যা হয়েছে: " + error.message);
      else alert("দৈনিক আমল সফলভাবে সংরক্ষণ করা হয়েছে!");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 text-slate-100">
      
      {/* Back to Dashboard Button & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b111e] hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs rounded-2xl border border-slate-800 transition shadow-lg cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-[#0b111e] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">দৈনিক আমল / কাজ চার্ট</h1>
          <p className="text-slate-400 text-sm mt-1">বিশেষ দ্রষ্টব্য: যে আমলটি যথাযথভাবে করবেন, তার ফাঁকা ঘরে টিক চিহ্ন দিন।</p>
        </div>
        <div>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none cursor-pointer"
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
              <th className="p-3 border-r border-slate-800">বিভাগ (Category)</th>
              <th className="p-3 border-r border-slate-800">কাজের নাম (Task Name)</th>
              <th className="p-3 text-center">অবস্থা (Status)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={4}>ফজর</td><td className="p-3 border-r">নামাজ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.fojor_namaz} onChange={() => handleCheckboxChange("fojor_namaz")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">ফাতিহা শরীফ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.fojor_fateha} onChange={() => handleCheckboxChange("fojor_fateha")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">কুয়াতে এলাহী ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.fojor_kuyate_elahi} onChange={() => handleCheckboxChange("fojor_kuyate_elahi")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">খতম শরীফ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.fojor_kotom} onChange={() => handleCheckboxChange("fojor_kotom")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={2}>যোহর</td><td className="p-3 border-r">নামাজ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.johor_namaz} onChange={() => handleCheckboxChange("johor_namaz")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">রাসুল (সা:) এন মহব্বতের ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.johor_wasul} onChange={() => handleCheckboxChange("johor_wasul")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={2}>আসর</td><td className="p-3 border-r">নামাজ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.asor_namaz} onChange={() => handleCheckboxChange("asor_namaz")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">তওবা ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.asor_towba} onChange={() => handleCheckboxChange("asor_towba")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={4}>মাগরিব</td><td className="p-3 border-r">নামাজ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.magrib_namaz} onChange={() => handleCheckboxChange("magrib_namaz")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">ফাতিহা শরীফ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.magrib_fateha} onChange={() => handleCheckboxChange("magrib_fateha")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">তওবা কবুলিয়তের ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.magrib_towba} onChange={() => handleCheckboxChange("magrib_towba")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">মিলাদ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.magrib_milad} onChange={() => handleCheckboxChange("magrib_milad")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={4}>এশা</td><td className="p-3 border-r">নামাজ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.esha_namaz} onChange={() => handleCheckboxChange("esha_namaz")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">গাইরিয়াতের ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.esha_faijaten} onChange={() => handleCheckboxChange("esha_faijaten")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">দরুদ শরীফ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.esha_darud} onChange={() => handleCheckboxChange("esha_darud")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">তওবা পাঠ (৫০০ বার)</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.esha_towba_path} onChange={() => handleCheckboxChange("esha_towba_path")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={2}>রহমত</td><td className="p-3 border-r">মিলাদ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.rohomot_milad} onChange={() => handleCheckboxChange("rohomot_milad")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">রহমতেন ফায়েজের মোরাকাবা</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.rohomot_faijaten} onChange={() => handleCheckboxChange("rohomot_faijaten")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>

            <tr><td className="p-3 font-bold text-blue-400 border-r" rowSpan={3}>অন্যান্য</td><td className="p-3 border-r">মোহাম্মাদী ইসলামের বই পাঠ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.mohammadi_islamer_boi} onChange={() => handleCheckboxChange("mohammadi_islamer_boi")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">প্রতিটি কাজে মোর্শেদকে স্মরণ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.protiti_kaje_morshed} onChange={() => handleCheckboxChange("protiti_kaje_morshed")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
            <tr><td className="p-3 border-r">উন্নয়ন বিষয়ক পরিকল্পনা / পরামর্শ</td><td className="p-3 text-center"><input type="checkbox" checked={tasks.unnayon_bisoyok_porikolpona} onChange={() => handleCheckboxChange("unnayon_bisoyok_porikolpona")} className="w-5 h-5 accent-blue-600 cursor-pointer" /></td></tr>
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition cursor-pointer disabled:opacity-50">
            {loading ? "সংরক্ষণ করা হচ্ছে..." : "দৈনিক কাজ সংরক্ষণ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}