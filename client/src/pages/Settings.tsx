import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [facebookAccessToken, setFacebookAccessToken] = useState("");
  const [facebookAdAccountId, setFacebookAdAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings status
  const { data: status } = trpc.settings.getStatus.useQuery();

  // Update credentials mutation
  const updateCredentials = trpc.settings.updateCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credentials updated successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error("Failed to update credentials: " + error.message);
      setIsSaving(false);
    },
  });

  // Validate credentials mutation
  const validateCredentials = trpc.settings.validateCredentials.useMutation({
    onSuccess: (data) => {
      if (data.notion) {
        toast.success("Notion connection valid");
      } else {
        toast.error("Notion connection failed");
      }
      if (data.facebook) {
        toast.success("Facebook connection valid");
      } else {
        toast.error("Facebook connection failed");
      }
    },
    onError: (error) => {
      toast.error("Validation failed: " + error.message);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    updateCredentials.mutate({
      notionToken: notionToken || undefined,
      notionDatabaseId: notionDatabaseId || undefined,
      facebookAccessToken: facebookAccessToken || undefined,
      facebookAdAccountId: facebookAdAccountId || undefined,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="editorial-headline mb-4">Settings</h1>
        <p className="editorial-subheading text-lg text-muted-foreground">
          Manage API credentials and integrations
        </p>
      </div>

      <div className="editorial-divider mb-8" />

      {/* Connection Status */}
      {status && (
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notion Status */}
          <div className="editorial-card">
            <div className="flex items-start justify-between mb-4">
              <h3 className="editorial-subheading text-lg">Notion</h3>
              <div
                className={`text-xs uppercase tracking-wider px-3 py-1 rounded-sm ${
                  status.notion.connected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {status.notion.connected ? "Connected" : "Disconnected"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {status.notion.connected
                ? "Your Notion workspace is connected and ready to sync ad drafts."
                : "Connect your Notion workspace to sync ad drafts."}
            </p>
            <div className="text-xs text-muted-foreground">
              <p>Token: {status.notion.hasToken ? "✓ Configured" : "✗ Missing"}</p>
              <p>Database: {status.notion.hasDatabaseId ? "✓ Configured" : "✗ Missing"}</p>
            </div>
          </div>

          {/* Facebook Status */}
          <div className="editorial-card">
            <div className="flex items-start justify-between mb-4">
              <h3 className="editorial-subheading text-lg">Facebook</h3>
              <div
                className={`text-xs uppercase tracking-wider px-3 py-1 rounded-sm ${
                  status.facebook.connected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {status.facebook.connected ? "Connected" : "Disconnected"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {status.facebook.connected
                ? "Your Facebook account is connected and ready to launch ads."
                : "Connect your Facebook account to launch ads."}
            </p>
            <div className="text-xs text-muted-foreground">
              <p>Token: {status.facebook.hasToken ? "✓ Configured" : "✗ Missing"}</p>
              <p>Ad Account: {status.facebook.hasAdAccountId ? "✓ Configured" : "✗ Missing"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Form */}
      <div className="max-w-2xl">
        <h2 className="editorial-subheading text-xl mb-6">API Credentials</h2>

        <div className="space-y-8">
          {/* Notion Section */}
          <div className="editorial-card">
            <h3 className="editorial-label mb-4">Notion Integration</h3>

            <div className="space-y-4">
              <div>
                <label className="editorial-label block mb-2">
                  Notion Integration Token
                </label>
                <Input
                  type="password"
                  placeholder="ntn_..."
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  className="editorial-input w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Create an integration at{" "}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    notion.so/my-integrations
                  </a>
                </p>
              </div>

              <div>
                <label className="editorial-label block mb-2">
                  Notion Database ID
                </label>
                <Input
                  placeholder="e.g., 123abc456def..."
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  className="editorial-input w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Database: "Schedule New Ad Creatives SOP - Allsleepers"
                </p>
              </div>
            </div>
          </div>

          {/* Facebook Section */}
          <div className="editorial-card">
            <h3 className="editorial-label mb-4">Facebook Marketing API</h3>

            <div className="space-y-4">
              <div>
                <label className="editorial-label block mb-2">
                  Facebook Access Token
                </label>
                <Input
                  type="password"
                  placeholder="EAAB..."
                  value={facebookAccessToken}
                  onChange={(e) => setFacebookAccessToken(e.target.value)}
                  className="editorial-input w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Generate at{" "}
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    developers.facebook.com/apps
                  </a>
                </p>
              </div>

              <div>
                <label className="editorial-label block mb-2">
                  Facebook Ad Account ID
                </label>
                <Input
                  placeholder="e.g., 123456789"
                  value={facebookAdAccountId}
                  onChange={(e) => setFacebookAdAccountId(e.target.value)}
                  className="editorial-input w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Format: act_123456789 (without "act_" prefix)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="editorial-divider-thin my-8" />

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || updateCredentials.isPending}
            className="editorial-button-primary"
          >
            {isSaving || updateCredentials.isPending ? "Saving..." : "Save Credentials"}
          </Button>
          <Button
            onClick={() => validateCredentials.mutate()}
            disabled={validateCredentials.isPending}
            className="editorial-button-secondary"
          >
            {validateCredentials.isPending ? "Validating..." : "Validate Connections"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          All credentials are encrypted and stored securely. They are never exposed in the frontend.
        </p>
      </div>
    </div>
  );
}
