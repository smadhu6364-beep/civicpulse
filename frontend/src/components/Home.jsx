import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchIssues } from "../services/api";
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  ThumbsUp,
  ChevronRight,
  Search,
} from "lucide-react";

const SEVERITY_STYLES = {
  high: {
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
};

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
};

function IssueCard({ issue, onClick }) {
  const sev = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium;
  const statusStyle = STATUS_STYLES[issue.status] || STATUS_STYLES.open;

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex gap-4"
      onClick={() => onClick(issue.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${sev.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {issue.severity}
          </span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusStyle}`}>
            {issue.status?.replace(/_/g, " ") || "open"}
          </span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
            {issue.category?.replace(/_/g, " ")}
          </span>
        </div>

        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
          {issue.summary || issue.description}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          {issue.location?.address && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={11} />
              {issue.location.address}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <ThumbsUp size={11} />
            {issue.upvotes || 0} upvotes
          </span>
          {issue.reporter_name && (
            <span className="truncate">by {issue.reporter_name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center text-gray-300 shrink-0">
        <ChevronRight size={20} />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch {
      setError("Failed to load issues. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = issues.filter((issue) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      issue.summary?.toLowerCase().includes(q) ||
      issue.description?.toLowerCase().includes(q) ||
      issue.category?.toLowerCase().includes(q) ||
      issue.location?.address?.toLowerCase().includes(q);
    const matchesSeverity =
      filterSeverity === "all" || issue.severity === filterSeverity;
    const matchesStatus =
      filterStatus === "all" || issue.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Issues</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${issues.length} issues reported`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 mt-1"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">
            {issues.length === 0 ? "No issues reported yet" : "No issues match your filters"}
          </p>
          <p className="text-sm">
            {issues.length === 0
              ? "Be the first to report a civic issue!"
              : "Try adjusting your search or filters."}
          </p>
        </div>
      )}

      {/* Issue list */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={(id) => navigate(`/issues/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
