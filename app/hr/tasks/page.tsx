"use client";

import { useState } from "react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
  date: string;
}

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Prepare Monthly Payroll Report",
      description: "Checked attendance logs and calculated bonuses for all departments.",
      assignee: "John Doe",
      priority: "High",
      status: "In Progress",
      date: "2026-10-24",
    },
    {
      id: "2",
      title: "Update Employee Database",
      description: "Added 3 new recruits and updated contact numbers.",
      assignee: "Sarah Smith",
      priority: "Medium",
      status: "Completed",
      date: "2026-10-24",
    },
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Filter & Search states for Admin View
  const [filterAssignee, setFilterAssignee] = useState("All");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignee) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: description || "No specific notes provided.",
      assignee,
      priority,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
    };

    setTasks([newTask, ...tasks]);
    setTitle("");
    setDescription("");
    setAssignee("");
  };

  const toggleStatus = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const nextStatus: Record<string, "Pending" | "In Progress" | "Completed"> = {
            Pending: "In Progress",
            "In Progress": "Completed",
            Completed: "Pending",
          };
          return { ...task, status: nextStatus[task.status] };
        }
        return task;
      })
    );
  };

  // Get unique list of employees for filter dropdown
  const uniqueEmployees = Array.from(new Set(tasks.map((t) => t.assignee)));

  const filteredTasks = filterAssignee === "All" 
    ? tasks 
    : tasks.filter((t) => t.assignee === filterAssignee);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span>📋</span> Employee Daily Tasks & Updates
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor what each employee is working on in real-time
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Create Task Form */}
        <form
          onSubmit={handleAddTask}
          className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-10 shadow-xl space-y-4"
        >
          <h2 className="text-lg font-bold text-white mb-2">Assign Task / Submit Update</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Task Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Landing Page Redesign"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Employee Name (Assignee)
              </label>
              <input
                type="text"
                required
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Work Description / Daily Progress Note
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write details about what is being done or completed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
              >
                Submit / Add Task
              </button>
            </div>
          </div>
        </form>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">Employee Work Logs</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase">Filter by Employee:</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Employees</option>
              {uniqueEmployees.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
              <p className="text-slate-400">No tasks found for this employee.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-base">{task.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        task.priority === "High"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : task.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-slate-300 text-sm bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-xs block mb-1 uppercase font-semibold">Update Note:</span>
                    {task.description}
                  </p>

                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>👤 Assigned to: <strong className="text-blue-400">{task.assignee}</strong></span>
                    <span>📅 Date: {task.date}</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                  <button
                    onClick={() => toggleStatus(task.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      task.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : task.status === "In Progress"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    ● {task.status} (Click to change)
                  </button>
                  <span className="text-[10px] text-slate-500">Click badge to update status</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}