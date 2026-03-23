import React from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Home,
  MessageSquare,
  Upload,
  Settings,
  TrendingUp,
} from "lucide-react";

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <Toaster position="top-center" />

        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white px-4 py-8 md:block hidden">
          <div className="mb-10 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              LifeOS
            </h1>
          </div>

          <nav className="space-y-1">
            <SidebarItem href="/" icon={<Home size={20} />} label="Dashboard" />
            <SidebarItem
              href="/chat"
              icon={<MessageSquare size={20} />}
              label="Business Chat"
            />
            <SidebarItem
              href="/upload"
              icon={<Upload size={20} />}
              label="Data Sync"
            />
            <SidebarItem
              href="/settings"
              icon={<Settings size={20} />}
              label="Settings"
            />
          </nav>

          <div className="absolute bottom-8 left-4 right-4">
            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Support
              </p>
              <p className="text-sm text-slate-700">
                Need help with your data? Ask the AI advisor.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-slate-200 bg-white md:hidden">
          <MobileNavItem href="/" icon={<Home size={24} />} label="Home" />
          <MobileNavItem
            href="/chat"
            icon={<MessageSquare size={24} />}
            label="Chat"
          />
          <MobileNavItem
            href="/upload"
            icon={<Upload size={24} />}
            label="Sync"
          />
          <MobileNavItem
            href="/settings"
            icon={<Settings size={24} />}
            label="Setup"
          />
        </nav>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0 md:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

function SidebarItem({ href, icon, label }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {icon}
      {label}
    </a>
  );
}

function MobileNavItem({ href, icon, label }) {
  return (
    <a
      href={href}
      className="flex flex-1 flex-col items-center justify-center text-slate-500 transition-colors hover:text-indigo-600"
    >
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </a>
  );
}
