import { useState } from "react";
import { X, ThumbsUp, ChevronDown, ChevronUp, MapPin, Tag, AlertTriangle, Building2 } from "lucide-react";
import { upvoteIssue } from "../services/api";

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

export default function IssueModal({ issue, onClose, onUpvoted }) {
  const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  const [voting, setVoting] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [voted, setVoted] = useState(false);

  async function handleUpvote() {
    if (voted || voting) return;
    setVoting(true);
    try {
      const data = await upvoteIssue(issue.id);
      setUpvotes(data.upvotes);
      setVoted(true);
      onUpvoted?.(issue.id, data.upvotes);
    } catch {
      // ignore
    } finally {
      setVoting(false);
    }
  }

  const category = issue.category?.replace(/_/g, " ") ?? "other";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium}`}>
                <AlertTriangle size={11} className="inline mr-1" />
                {issue.severity} severity
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[issue.status] || STATUS_STYLES.open}`}>
                {issue.status?.replace(/_/g, " ")}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 capitalize">{category}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* AI Summary */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-700 mb-1">AI Analysis</p>
            <p className="text-gray-700 text-sm leading-relaxed">{issue.summary}</p>
          </div>

          {/* Photo */}
          {issue.image_url && (
            <div className="rounded-xl overflow-hidden border bg-gray-100">
              <img
                src={issue.image_url}
                alt={`Reported ${category} issue`}
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}
        
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Tag size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Category</p>
                <p className="text-sm text-gray-800 capitalize">{category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Authority</p>
                <p className="text-sm text-gray-800">{issue.authority}</p>
              </div>
            </div>
            {issue.location?.address && (
              <div className="flex items-start gap-2 col-span-2">
                <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm text-gray-800">{issue.location.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Reporter description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
          </div>

          {/* Reporter */}
          {issue.reporter_name && (
            <p className="text-xs text-gray-400">
              Reported by <span className="font-medium text-gray-600">{issue.reporter_name}</span>
              {issue.reporter_email && ` · ${issue.reporter_email}`}
            </p>
          )}

          {/* Complaint letter toggle */}
          <div className="border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
              onClick={() => setLetterOpen(!letterOpen)}
            >
              <span>AI-Generated Complaint Letter</span>
              {letterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {letterOpen && (
              <div className="p-4 bg-white">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {issue.complaint_letter}
                </pre>
                <button
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => {
                    navigator.clipboard.writeText(issue.complaint_letter);
                  }}
                >
                  Copy to clipboard
                </button>
              </div>
            )}
          </div>

          {/* Upvote */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{upvotes}</span> community{" "}
              {upvotes === 1 ? "verification" : "verifications"}
            </p>
            <button
              onClick={handleUpvote}
              disabled={voted || voting}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                voted
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              <ThumbsUp size={15} />
              {voted ? "Verified!" : voting ? "Submitting..." : "Verify & Upvote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
