import { AdDraft, LLMSuggestion } from "@/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AdDraftCardProps {
  draft: AdDraft;
  suggestions?: LLMSuggestion;
  onApprove: (headline: string, primaryText: string) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export default function AdDraftCard({
  draft,
  suggestions,
  onApprove,
  onReject,
  isLoading = false,
}: AdDraftCardProps) {
  const [useSuggestions, setUseSuggestions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const displayHeadline = useSuggestions && suggestions ? suggestions.suggestedHeadline : draft.headline;
  const displayText = useSuggestions && suggestions ? suggestions.suggestedText : draft.primaryText;

  const handleApprove = () => {
    onApprove(displayHeadline, displayText);
  };

  return (
    <div className="editorial-card mb-8">
      {/* Status Badge */}
      <div className="mb-6 flex items-center justify-between">
        <span className="editorial-label">{draft.status}</span>
        {draft.imageUrl && (
          <span className="text-xs text-muted-foreground">Image attached</span>
        )}
      </div>

      {/* Image Preview */}
      {draft.imageUrl && (
        <div className="mb-6 -mx-6 -mt-6 mb-6">
          <img
            src={draft.imageUrl}
            alt="Ad preview"
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Headline */}
      <div className="mb-6">
        <h3 className="editorial-label mb-2">Headline</h3>
        <p className="editorial-subheading text-xl">{displayHeadline}</p>
      </div>

      {/* Primary Text */}
      <div className="mb-6">
        <h3 className="editorial-label mb-2">Primary Text</h3>
        <p className="text-base leading-relaxed">{displayText}</p>
      </div>

      {/* LLM Suggestions */}
      {suggestions && (
        <div className="mb-6 p-4 bg-secondary/30 border border-border rounded-sm">
          <div className="flex items-start justify-between mb-4">
            <h4 className="editorial-label">AI Suggestions</h4>
            <button
              onClick={() => setUseSuggestions(!useSuggestions)}
              className="text-xs uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
            >
              {useSuggestions ? "Using" : "View"} Suggestions
            </button>
          </div>

          {!useSuggestions && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="editorial-label mb-1">Suggested Headline</p>
                <p className="text-foreground">{suggestions.suggestedHeadline}</p>
              </div>
              <div>
                <p className="editorial-label mb-1">Suggested Text</p>
                <p className="text-foreground">{suggestions.suggestedText}</p>
              </div>
              <div>
                <p className="editorial-label mb-1">Why</p>
                <p className="text-muted-foreground italic">{suggestions.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Targeting Info */}
      {draft.targetingJson && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          {showDetails ? "Hide" : "Show"} Targeting Details
        </button>
      )}

      {showDetails && draft.targetingJson && (
        <div className="mb-6 p-4 bg-secondary/20 border border-border rounded-sm text-sm">
          <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
            {JSON.stringify(draft.targetingJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Divider */}
      <div className="editorial-divider-thin mb-6" />

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-sm font-medium uppercase tracking-wider text-sm transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Launching..." : "Approve & Launch"}
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-transparent border border-border text-foreground rounded-sm font-medium uppercase tracking-wider text-sm transition-all hover:bg-secondary disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {/* Note about suggestions */}
      {suggestions && !useSuggestions && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          AI-generated suggestions available • Click "View Suggestions" to review
        </p>
      )}
    </div>
  );
}
