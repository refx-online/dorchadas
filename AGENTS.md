# Repository Guidelines

## Project Structure & Module Organization

This is a SvelteKit frontend built with Vite and Bun. Application routes live in `src/routes`, using SvelteKit conventions such as `+page.svelte`, `+page.server.ts`, and `+server.ts`. Shared utilities, API clients, types, i18n files, and reusable components live under `src/lib`; server-only shared code belongs in `src/lib/server`. Global app files are `src/app.html`, `src/app.postcss`, and `src/hooks.server.ts`. Static assets are served from `static`, including flags, mod icons, patcher screenshots, and global CSS. Custom Vite helper code is in `vite/`.

## Build, Test, and Development Commands

- `bun run dev`: start the local Vite development server.
- `bun run build`: create the production SvelteKit build.
- `bun run preview`: preview the built app locally.
- `bun run start`: run `./build/index.js` with dotenv loaded.
- `bun run check`: sync SvelteKit types and run `svelte-check`.
- `bun run ci`: run type checks and lint checks.
- `bun run lint`: run Prettier in check mode, then ESLint.
- `bun run format`: format the repository with Prettier.
- `make build`: build the Docker image tagged `frontend:latest`.
- `make run`: run the Docker image with `.env` and host networking.

## Coding Style & Naming Conventions

Use TypeScript modules and Svelte components. Formatting is controlled by `.prettierrc`: tabs, single quotes, no trailing commas, and 100-column print width. Component files use PascalCase, for example `Leaderboard.svelte`; route folders use lowercase or SvelteKit parameter syntax such as `u/[userId]`. Keep server-only logic in `+page.server.ts`, `+server.ts`, or server-side `src/lib` modules.

## Testing Guidelines

No dedicated test framework or test files are currently present. For changes, run `bun run check` and `bun run lint` before handoff. If adding tests later, place them near the code they cover with `*.test.ts` or `*.spec.ts`, and document the new test command in `package.json` and this guide.

## Commit & Pull Request Guidelines

Recent history uses short conventional-style subjects such as `fix: use MYSQL_PORT for database connection` and `refactor: rename language to i18n`. Keep commits focused and imperative. Pull requests should include a concise summary, linked issue when applicable, screenshots for visual changes, environment/config notes, and the checks run locally.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local configuration. Do not commit secrets, database credentials, Turnstile keys, webhook URLs, or private service endpoints. Public browser-exposed values should use the existing `PUBLIC_` prefix pattern.
