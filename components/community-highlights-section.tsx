import { CommunityHighlightsPage } from "@/components/community-highlights-page";

export function CommunityHighlightsSection() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Highlights</h1>
        <p className="text-muted-foreground">
          Manage the community highlight images shown on the product detail page.
        </p>
      </div>
      <CommunityHighlightsPage />
    </div>
  );
}
