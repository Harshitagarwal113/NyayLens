"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-500 mt-1.5 text-sm font-medium">Manage your account preferences and security.</p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Account Details
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Email Address</label>
                <div className="mt-1 flex items-center gap-2 text-slate-900 bg-slate-50 p-2.5 rounded-lg border">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">User ID</label>
                <div className="mt-1 flex items-center gap-2 text-slate-500 bg-slate-50 p-2.5 rounded-lg border font-mono text-xs truncate">
                  <Key className="h-4 w-4 text-slate-400" />
                  {user?.id}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Security
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">Your account is secured via Supabase authentication.</p>
            <Button variant="outline" className="text-slate-700">Change Password</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
