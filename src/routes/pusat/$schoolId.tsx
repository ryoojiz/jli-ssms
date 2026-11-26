import { createFileRoute } from "@tanstack/react-router";

import { DetailSekolahPusat } from "@/components/pusat-dashboard";

export const Route = createFileRoute("/pusat/$schoolId")({
  head: () => ({
    meta: [
      { title: "Detail Sekolah — Dashboard Pusat | SMS" },
      {
        name: "description",
        content: "Drilldown data gabungan untuk satu sekolah.",
      },
    ],
  }),
  component: KomponenDetail,
});

function KomponenDetail() {
  const { schoolId } = Route.useParams();
  return <DetailSekolahPusat schoolId={schoolId} />;
}
