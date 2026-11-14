# GitHub Pages

Repository: [Orion-North/last-light](https://github.com/Orion-North/last-light).

GitHub Pages is the release target requested by the user. In repository Settings
→ Pages, select **GitHub Actions** as the source. The checked-in workflow runs
syntax/content checks and the behavior tests, builds `dist/`, then deploys that
artifact. Pushes to `main` or manual workflow dispatch trigger deployment.

Use Node 24 locally. No package installation, API keys, paid services, backend,
or game account is required. All game asset URLs are relative so the project
works under the `/last-light/` project path. Do not add a root `<base href="/">`.

Only the build output is served by Pages. Source, tests, agent instructions, and
asset attribution remain in the repository. There is no application telemetry.
The older private Sites preview is a separate, previous release.

[GitHub custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
