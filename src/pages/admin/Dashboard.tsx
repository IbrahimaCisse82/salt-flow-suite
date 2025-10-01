import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { AdminDashboard } from "@/components/Admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto md:ml-64">
          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}
