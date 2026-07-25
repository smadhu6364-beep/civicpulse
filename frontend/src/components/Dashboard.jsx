import { useEffect, useState } from "react";
import { fetchDashboard, fetchIssues } from "../services/api";
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import IssueModal from "./IssueModal";

const CATEGORY_LABELS = {
  pothole: "Pothole",
  broken_streetlight: "Broken Streetlight",
  garbage: "Garbage",
  water_leakage: "Water Leakage",
  damaged_road: "Damaged Road",
  illegal_dumping: "Illegal Dumping",
  graffiti: "Graffiti",
  traffic_signal_issue: "Traffic Signal",
  sidewalk_damage: "Sidewalk Damage",
  flooding: "Flooding",
  other: "Other",
};

const SEVERITY_COLORS = {
  high: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
  medium: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  low: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200" },
};

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-600 text-white",
    green: "bg-green-600 text-white",
    amber: "bg-amber-500 text-white",
    red: "bg-red-500 text-white",
  };
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function IssueRow({ issue, onClick }) {
  const sev = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;
  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(issue)}
    >
      <td className="px-4 py-3 text-sm text-gray-800 capitalize">
        {issue.category?.replace(/_/g, " ") || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {issue.summary || issue.description}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${sev.bg} ${sev.text}`}>
          {issue.severity}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {issue.upvotes || 0}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
          issue.status === "resolved"
            ? "bg-green-100 text-green-700"
            : issue.status === "in_progress"
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {issue.status?.replace(/_/g, " ") || "open"}
        </span>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([fetchDashboard(), fetchIssues()]);
      setStats(s);
      setIssues(i);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleUpvoted(id, newCount) {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, upvotes: newCount } : i)));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const maxCat = Math.max(1, ...(stats?.top_categories?.map((c) => c.count) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Community issue overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Issues" value={stats?.total_issues ?? 0} color="blue" />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats?.resolved_issues ?? 0}
          sub={`${stats?.resolution_rate ?? 0}% resolution rate`}
          color="green"
        />
        <StatCard icon={Clock} label="In Progress" value={stats?.in_progress_issues ?? 0} color="amber" />
        <StatCard icon={AlertTriangle} label="Open" value={stats?.open_issues ?? 0} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top categories */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">Top Issue Categories</h2>
          {stats?.top_categories?.length ? (
            <div className="space-y-3">
              {stats.top_categories.map(({ category, count }) => (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize font-medium">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span className="text-gray-500 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
          )}
        </div>

        {/* Severity breakdown */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">Severity Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(stats?.severity_breakdown || {}).map(([sev, count]) => {
              const style = SEVERITY_COLORS[sev] || SEVERITY_COLORS.medium;
              const total = stats?.total_issues || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-semibold capitalize ${style.text}`}>{sev}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent issues table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Recent Reports</h2>
        </div>
        {issues.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Summary</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Upvotes</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.slice(0, 20).map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onClick={setSelected} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">
            No issues reported yet. Be the first!
          </div>
        )}
      </div>

      {selected && (
        <IssueModal
          issue={selected}
          onClose={() => setSelected(null)}
          onUpvoted={handleUpvoted}
        />
      )}
    </div>
  );
}
