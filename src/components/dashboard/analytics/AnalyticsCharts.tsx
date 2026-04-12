"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SeriesPoint {
  date: string;
  value: number;
}

interface ChartProps {
  contactSeries: SeriesPoint[];
  messageSeries: SeriesPoint[];
  platformBreakdown: Array<{ name: string; value: number }>;
  keywordTriggers: Array<{ keyword: string; trigger_fires_count: number }>;
  stats: {
    totalContacts: number;
    totalMessages: number;
    mostActiveDay: string;
    topPlatform: string;
  };
  rangeLabel: string;
}

const platformColors = ["#4f46e5", "#0ea5e9"];

export default function AnalyticsCharts({
  contactSeries,
  messageSeries,
  platformBreakdown,
  keywordTriggers,
  stats,
  rangeLabel,
}: ChartProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Total contacts (${rangeLabel})`} value={stats.totalContacts.toLocaleString()} />
        <StatCard label={`Total messages (${rangeLabel})`} value={stats.totalMessages.toLocaleString()} />
        <StatCard label="Most active day" value={stats.mostActiveDay} />
        <StatCard label="Top platform" value={stats.topPlatform} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Contacts over time" description="Conversation threads created per day">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={contactSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Messages per day" description="Message logs grouped by date">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={messageSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform breakdown" description="Instagram vs Messenger contacts">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={platformBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={70}
                paddingAngle={4}
              >
                {platformBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={platformColors[index % platformColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top keyword triggers fired" description="Triggers ranked by fire count">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={keywordTriggers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="keyword" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="trigger_fires_count" fill="#4338ca" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
