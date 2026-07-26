import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchIssue, upvoteIssue } from "../services/api";
import {
  ArrowLeft,
  ThumbsUp,
  MapPin,
  Tag,
  Building2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
};

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchIssue(id);
        setIssue(data);
        setUpvotes(data.upvotes || 0);
      } catch {
        setError("Issue not found or failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleUpvote() {
    if (voted || voting) return;
    setVoting(true);
    try {
      const data = await upvoteIssue(id);
      setUpvotes(data.upvotes);
      setVoted(true);
    } catch {
      // ignore
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium mb-4">{error || "Issue not found."}</p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to issues
        </button>
      </div>
    );
  }

  const category = issue.category?.replace(/_/g, " ") ?? "other";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border capitalize ${
            SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium
          }`}
        >
          <AlertTriangle size={11} />
          {issue.severity} severity
        </span>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
            STATUS_STYLES[issue.status] || STATUS_STYLES.open
          }`}
        >
          {issue.status?.replace(/_/g, " ") || "open"}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 capitalize mb-6">{category}</h1>

      {/* Photo */}
      {issue.image_url && (
        <div className="rounded-2xl overflow-hidden border shadow-sm mb-6 bg-gray-100">
          <img
            src={issue.image_url}
            alt={`Reported ${category} issue`}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
          AI Analysis
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">{issue.summary}</p>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Tag size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Category</p>
            <p className="text-sm text-gray-800 capitalize">{category}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Responsible Authority</p>
            <p className="text-sm text-gray-800">{issue.authority || "N/A"}</p>
          </div>
        </div>
        {issue.location?.address && (
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Location</p>
              <p className="text-sm text-gray-800">{issue.location.address}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
        <p className="text-xs text-gray-500 font-medium mb-2">Reporter description</p>
        <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
        {issue.reporter_name && (
          <p className="text-xs text-gray-400 mt-3">
            Reported by{" "}
            <span className="font-medium text-gray-600">{issue.reporter_name}</span>
            {issue.reporter_email && ` · ${issue.reporter_email}`}
          </p>
        )}
      </div>

      {/* Complaint letter */}
      {issue.complaint_letter && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
          <button
            className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            onClick={() => setLetterOpen(!letterOpen)}
          >
            <span>AI-Generated Complaint Letter</span>
            {letterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {letterOpen && (
            <div className="px-5 py-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {issue.complaint_letter}
              </pre>
              <button
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => navigator.clipboard.writeText(issue.complaint_letter)}
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upvote */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900 text-lg">{upvotes}</span>{" "}
          community {upvotes === 1 ? "verification" : "verifications"}
        </p>
        <button
          onClick={handleUpvote}
          disabled={voted || voting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            voted
              ? "bg-green-100 text-green-700 cursor-default"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }`}
        >
          <ThumbsUp size={15} />
          {voted ? "Verified!" : voting ? "Submitting…" : "Verify & Upvote"}
        </button>
      </div>
    </div>
  );
}
