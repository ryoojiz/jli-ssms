<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Imported school data (guru/kelas/siswa/kehadiran) lives in Cloud tables accessed only via server functions in src/lib/data-sekolah.functions.ts and merged into demo arrays by src/lib/data-cloud.ts — app login is still demo, so tables stay locked from direct client access.
- Role `pusat` (Dinas Pendidikan) is read-only like `auditor`, has memberships in every school, and owns the cross-school dashboard: `/` renders the executive summary, `/pusat` the full dashboard, `/pusat/$schoolId` the drilldown. Data comes only from server functions in `src/lib/pusat.functions.ts` guarded by `requireIdentity(["pusat"])`.
- Create/rotate that account with `npm run db:bootstrap-pusat` (`ACCOUNT_EMAIL`, `ACCOUNT_NAME`, `ACCOUNT_PASSWORD`, optional `ACCOUNT_ROTATE_PASSWORD=yes`); never expose its password in the repo.
- Public landing page lives at `/selamat-datang`; unauthenticated AppShell redirects there instead of `/auth`, and signed-in users are redirected from both landing and auth back to `/`.
