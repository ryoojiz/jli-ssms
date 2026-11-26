import { createFileRoute } from "@tanstack/react-router";

import { DashboardPusat } from "@/components/pusat-dashboard";

export const Route = createFileRoute("/pusat/")({
  head: () => ({
    meta: [
      { title: "Dashboard Pusat — SMS Sekolah" },
      {
        name: "description",
        content: "Data gabungan seluruh sekolah dengan drilldown per sekolah.",
      },
    ],
  }),
  component: DashboardPusat,
});
