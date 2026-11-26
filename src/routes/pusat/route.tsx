import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Rute induk untuk halaman pusat. Komponen induk sengaja hanya meneruskan
 * children agar /pusat dan /pusat/$schoolId dirender oleh komponen masing-masing.
 */
export const Route = createFileRoute("/pusat")({
  component: () => <Outlet />,
});
