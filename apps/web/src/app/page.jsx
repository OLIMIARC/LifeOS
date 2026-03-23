import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  CheckCircle2,
  ArrowRight,
  Bell,
  Target,
  TrendingDown,
  Volume2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const ownerId = "default_owner"; // Placeholder

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ["dashboard", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ["alerts", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/alerts?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch actions
  const { data: actionsData } = useQuery({
    queryKey: ["actions", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/actions?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch forecasts
  const { data: forecastsData } = useQuery({
    queryKey: ["forecasts", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/forecasts?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch voice briefing
  const { data: briefingData } = useQuery({
    queryKey: ["voice-briefing", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/voice-briefing?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  if (loadingBusiness)
    return (
      <div className="flex h-96 items-center justify-center">Loading...</div>
    );

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Welcome to LifeOS</h2>
        <p className="mt-2 text-slate-600 max-w-md">
          Let's set up your business so you can start talking to it.
        </p>
        <a
          href="/settings"
          className="mt-8 rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-indigo-700 transition-all"
        >
          Register Business
        </a>
      </div>
    );
  }

  const { summary, topItems, lowStock, recentInsights } = dashboard || {};
  const alerts = alertsData?.alerts || [];
  const actions = actionsData?.actions || [];
  const forecasts = forecastsData?.forecasts || [];
  const briefing = briefingData?.briefing;

  const criticalAlerts = alerts.filter(
    (a) => a.severity === "critical" && !a.is_read,
  );
  const pendingActions = actions.filter((a) => !a.is_completed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Good morning, {business.name}
        </h2>
        <p className="text-slate-500 mt-1">
          Here's the pulse of your business today.
        </p>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-2">
              <Bell size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                Critical Alerts Require Attention
              </h3>
              <div className="mt-2 space-y-2">
                {criticalAlerts.slice(0, 2).map((alert) => (
                  <p key={alert.id} className="text-sm text-red-700">
                    • {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          title="30d Revenue"
          value={`$${Number(summary?.total_revenue || 0).toLocaleString()}`}
          icon={<TrendingUp className="text-emerald-500" />}
          trend="+8% from last month"
        />
        <StatCard
          title="30d Profit"
          value={`$${Number(summary?.total_profit || 0).toLocaleString()}`}
          icon={<TrendingUp className="text-indigo-500" />}
          trend={`${Number(summary?.avg_margin || 0).toFixed(1)}% margin`}
        />
        <StatCard
          title="Active Alerts"
          value={alerts.filter((a) => !a.is_read).length}
          icon={<Bell className="text-amber-500" />}
          trend={`${criticalAlerts.length} critical`}
        />
        <StatCard
          title="Actions Due"
          value={pendingActions.length}
          icon={<Target className="text-blue-500" />}
          trend="Recommendations"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Voice Briefing */}
          {briefing && (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-4">
                <Volume2 size={24} />
                <h3 className="text-lg font-semibold">Weekly Voice Briefing</h3>
              </div>
              <p className="text-indigo-50 text-sm whitespace-pre-line leading-relaxed">
                {briefing.briefing_text?.slice(0, 300)}...
              </p>
              <button className="mt-4 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
                Read Full Briefing
              </button>
            </div>
          )}

          {/* Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-slate-900">
              Top Performing Items
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="item_name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Recommended Actions
              </h3>
              <span className="text-sm text-indigo-600 font-medium">
                View All
              </span>
            </div>
            <div className="space-y-3">
              {pendingActions.slice(0, 4).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {action.action_text}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {action.category}
                    </span>
                  </div>
                </div>
              ))}
              {pendingActions.length === 0 && (
                <div className="rounded-xl border border-slate-200 border-dashed p-8 text-center">
                  <p className="text-sm text-slate-500">
                    All actions completed! Great work.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Forecasts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Business Forecasts
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {forecasts.slice(0, 3).map((forecast) => (
                <div
                  key={forecast.id}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mt-1 rounded-full bg-purple-100 text-purple-600 p-2">
                    <TrendingDown size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {forecast.prediction}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        {forecast.confidence_level} confidence
                      </span>
                      {forecast.target_date && (
                        <span className="text-xs text-slate-500">
                          Target:{" "}
                          {new Date(forecast.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {forecasts.length === 0 && (
                <div className="rounded-xl border border-slate-200 border-dashed p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No forecasts available yet. Add more sales data for
                    predictions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Briefing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Intelligence Briefing
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {recentInsights?.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`mt-1 rounded-full p-2 ${insight.type === "warning" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}
                  >
                    {insight.type === "warning" ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {insight.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      {insight.type}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentInsights || recentInsights.length === 0) && (
                <div className="rounded-xl border border-slate-200 border-dashed p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No insights yet. Sync your data to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-900 p-6 text-white shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Ask LifeOS</h3>
            <p className="text-indigo-100 text-sm mb-6">
              "Why is my profit margin down this week?"
            </p>
            <a
              href="/chat"
              className="flex items-center justify-between rounded-xl bg-white/10 p-4 font-medium transition-colors hover:bg-white/20"
            >
              Start a session
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Alerts Sidebar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <div
                    className={`mt-1 rounded-full p-1.5 ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-600"
                        : alert.severity === "warning"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Bell size={14} />
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-slate-500">No active alerts.</p>
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </h3>
            <div className="space-y-4">
              {lowStock?.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <Package size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.item_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} left
                      </p>
                    </div>
                  </div>
                  <a
                    href="/upload"
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Restock
                  </a>
                </div>
              ))}
              {(!lowStock || lowStock.length === 0) && (
                <p className="text-xs text-slate-500">
                  Inventory levels are healthy.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        <span className="mt-1 text-xs font-medium text-slate-500">{trend}</span>
      </div>
    </div>
  );
}
