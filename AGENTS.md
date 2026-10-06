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
