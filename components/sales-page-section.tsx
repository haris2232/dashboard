import { SalesImagesPage } from "@/components/sales-images-page";

export function SalesPageSection() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Page</h1>
        <p className="text-muted-foreground">Manage promotional content for your sales page.</p>
      </div>
      <SalesImagesPage />
    </div>
  );
}