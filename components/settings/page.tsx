import { HomepageImagesPage } from "@/components/settings/homepage-images-page";

export default function HomepageImages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Homepage Images</h1>
        <p className="text-muted-foreground">Manage the main images displayed on your homepage.</p>
      </div>
      <HomepageImagesPage />
    </div>
  );
}