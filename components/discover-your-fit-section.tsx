import { DiscoverYourFitPage } from "@/components/discover-your-fit-page";

export function DiscoverYourFitSection() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover Your Fit</h1>
        <p className="text-muted-foreground">
          Manage the four images that power the Discover Your Fit cards on the
          homepage.
        </p>
      </div>
      <DiscoverYourFitPage />
    </div>
  );
}

