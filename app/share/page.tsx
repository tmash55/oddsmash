import { ClientShareHandler } from "@/components/share-page/CLientShareHandler";
import { Suspense } from "react";

export default function SharePage() {
  return (
    <div className="container py-10">
      <Suspense fallback={<p className="text-center">Loading share info...</p>}>
        <ClientShareHandler />
      </Suspense>
    </div>
  );
}
