import { trpc } from "@/lib/trpc";
import AdDraftCard from "@/components/AdDraftCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("Pending Review");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Fetch drafts
  const { data: drafts = [], isLoading, refetch } = trpc.drafts.list.useQuery({
    status: statusFilter,
  });

  // Generate suggestions mutation
  const generateSuggestions = trpc.drafts.generateSuggestions.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Suggestions generated");
    },
    onError: (error) => {
      toast.error("Failed to generate suggestions: " + error.message);
    },
  });

  // Approve mutation
  const approveDraft = trpc.drafts.approve.useMutation({
    onSuccess: (data) => {
      toast.success(`Ad launched! Facebook Ad ID: ${data.facebookAdId}`);
      setApprovingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to launch ad: " + error.message);
      setApprovingId(null);
    },
  });

  // Reject mutation
  const rejectDraft = trpc.drafts.reject.useMutation({
    onSuccess: () => {
      toast.success("Draft rejected");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to reject draft: " + error.message);
    },
  });

  // Sync from Notion
  const syncDrafts = trpc.notion.syncDrafts.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.draftsFetched} new drafts from Notion`);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to sync from Notion: " + error.message);
    },
  });

  const handleApprove = async (draftId: number, headline: string, primaryText: string) => {
    setApprovingId(draftId);
    approveDraft.mutate({
      id: draftId,
      useHeadline: headline,
      usePrimaryText: primaryText,
    });
  };

  const handleReject = (draftId: number) => {
    rejectDraft.mutate({ id: draftId });
  };

  const handleGenerateSuggestions = (draftId: number) => {
    generateSuggestions.mutate({ id: draftId });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="editorial-headline mb-4">Ad Approval Dashboard</h1>
        <p className="editorial-subheading text-lg text-muted-foreground">
          Review, refine, and launch ad creatives with AI-powered suggestions
        </p>
      </div>

      <div className="editorial-divider mb-8" />

      {/* Controls */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {["Pending Review", "Approved", "Rejected", "Launched", "Failed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs uppercase tracking-wider px-3 py-2 rounded-sm transition-all ${
                statusFilter === status
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <Button
          onClick={() => syncDrafts.mutate()}
          disabled={syncDrafts.isPending}
          variant="outline"
          size="sm"
        >
          {syncDrafts.isPending ? "Syncing..." : "Sync from Notion"}
        </Button>
      </div>

      {/* Drafts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="editorial-label">Loading drafts...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12">
          <p className="editorial-subheading text-lg mb-4">No drafts found</p>
          <p className="text-muted-foreground mb-6">
          {statusFilter === "Pending Review"
              ? "Sync new drafts from Notion to get started"
              : `No drafts with status "${statusFilter}"`}
            </p>
            {statusFilter === "Pending Review" && (
            <Button
              onClick={() => syncDrafts.mutate()}
              disabled={syncDrafts.isPending}
            >
              {syncDrafts.isPending ? "Syncing..." : "Sync Drafts Now"}
            </Button>
            )}
        </div>
      ) : (
        <div>
          {drafts.map((draft: any) => (
            <div key={draft.id}>
              <AdDraftCard
                draft={draft}
                suggestions={draft.suggestions}
                onApprove={(headline, primaryText) =>
                  handleApprove(draft.id, headline, primaryText)
                }
                onReject={() => handleReject(draft.id)}
                isLoading={approvingId === draft.id}
              />
              {draft.suggestions === null && statusFilter === "Pending Review" && (
                <div className="mb-8 p-4 bg-secondary/20 border border-border rounded-sm flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    AI suggestions not yet generated for this draft
                  </p>
                  <Button
                    onClick={() => handleGenerateSuggestions(draft.id)}
                    disabled={generateSuggestions.isPending}
                    size="sm"
                    variant="outline"
                  >
                    {generateSuggestions.isPending ? "Generating..." : "Generate Suggestions"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
