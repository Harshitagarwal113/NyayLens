"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white text-slate-800 border-r border-slate-200/80 shadow-[1px_0_15px_rgba(0,0,0,0.03)] z-10">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200/80">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200">
            <img src="/logo.jpg" alt="NyayLens Logo" className="w-full h-full object-cover" />
          </div>
          <span>NyayLens</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
              )} aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200/80 flex flex-col gap-2 bg-slate-50/50">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700">
          <div className="bg-white border border-slate-200 shadow-sm p-1.5 rounded-full text-slate-500">
            <User className="h-4 w-4" />
          </div>
          <span className="truncate">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : "Account")}
          </span>
        </div>
        <button 
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer text-left group"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
