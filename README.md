# bpy-web

A modern frontend web application built with SvelteKit for the [bancho.py backend by Akatsuki](https://github.com/osuAkatsuki/bancho.py). This project provides a feature-rich web interface for osu! private server instances.

> [!WARNING]
> **Production Warning:** This project is currently in active development and is not recommended for production use. Some features may be incomplete or unstable.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### Implemented ✅

- **Multi Language Support:** Users can choose their preferred language
- **User Pages:** View user profiles and detailed statistics
- **Authentication:** Secure login system with session management
- **Beatmap Pages:** Browse and view detailed information about beatmaps
- **Leaderboards:** Rankings based on various performance metrics
- **User Registration:** Complete registration flow with validation
- **Pinned Scores:** Users can pin their favorite scores to their profile

### Planned 🚧

- **User Settings:** Account customization and preference management
- **Beatmap Requests:** Request system for ranking/loving/approving beatmaps
- **Admin Panel:** Administrative interface for managing users, beatmaps, and system settings

## Technology Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Runtime:** [Bun](https://bun.sh/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Skeleton UI](https://www.skeleton.dev/)
- **Database:** MySQL (via [Knex.js](https://knexjs.org/))
- **Cache:** Redis
- **Language:** TypeScript

## Requirements

- **Backend:** A working [bancho.py](https://github.com/osuAkatsuki/bancho.py) instance
- **Runtime:** [Bun](https://bun.sh/) (latest version recommended)
- **Database:** MySQL 5.7+ or MySQL 8.0+
- **Cache:** Redis 6.0+
- **Node.js:** Not required (Bun is used instead)

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Bun runtime
- MySQL server
- Redis server
- Access to a bancho.py instance

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/HorizonCode/bpy-web.git
cd bpy-web
```

2. **Install Bun** (if not already installed):

```bash
curl -fsSL https://bun.sh/install | bash
```

3. **Install dependencies:**

```bash
bun install
```

### Configuration

1. **Create environment file:**

```bash
cp example.env .env
```

2. **Configure environment variables:**

Edit `.env` with your preferred editor and configure the following:

- **Database:** MySQL connection details
- **Redis:** Redis connection details
- **API URLs:** Your bancho.py API endpoints
- **Captcha:** Cloudflare Turnstile keys (if using registration)
- **Paths:** Avatar and data directory paths

See [Environment Variables](#environment-variables) for detailed information.

### Running the Application

#### Development Mode

Start the development server with hot-reload:

```bash
bun run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your `.env`).

#### Production Build

Build and run the production version:

```bash
bun run compile
```

This will:

1. Build the application (`bun run build`)
2. Start the production server (`bun start`)

#### Preview Production Build

Preview the production build locally:

```bash
bun run build
bun run preview
```

## Available Scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `bun run dev`         | Start development server with hot-reload     |
| `bun run build`       | Build the application for production         |
| `bun run compile`     | Build and start production server            |
| `bun run start`       | Start the production server (requires build) |
| `bun run preview`     | Preview the production build locally         |
| `bun run check`       | Run TypeScript and Svelte type checking      |
| `bun run check:watch` | Run type checking in watch mode              |
| `bun run lint`        | Run ESLint and Prettier checks               |
| `bun run format`      | Format code with Prettier                    |

## Environment Variables

Key environment variables (see `example.env` for complete list):

### Server Configuration

- `PORT` - Server port (default: `3000`)
- `HOST` - Server host (default: `127.0.0.1`)

### Database

- `MYSQL_HOST` - MySQL server host
- `MYSQL_PORT` - MySQL server port (default: `3306`)
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - Database name (typically `gulag`)

### Redis

- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port (default: `6379`)
- `REDIS_DB` - Redis database number
- `REDIS_PASSWORD` - Redis password (if required)

### API Configuration

- `PUBLIC_API_URL` - bancho.py API base URL
- `PUBLIC_APP_URL` - Frontend application URL
- `PUBLIC_AVATAR_URL` - Avatar CDN URL

### Security

- `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret key
- `ALLOW_REGISTRATIONS` - Enable/disable user registration (`true`/`false`)

### Paths

- `AVATAR_DIRECTORY` - Path to avatar storage directory
- `DATA_DIRECTORY` - Path to application data directory

## Development

### Code Style

This project follows strict coding standards:

- **Naming:** kebab-case for files, camelCase for variables, PascalCase for types
- **Architecture:** Clean separation between routes, API, stores, and utilities
- **Error Handling:** No client-side console logging; errors handled via UI state
- **Type Safety:** Full TypeScript coverage with no `any` types

See `.cursor/rules/typescript.mdc` for detailed coding standards.

### Type Checking

Run type checking:

```bash
bun run check
```

### Linting

Check code style:

```bash
bun run lint
```

Format code:

```bash
bun run format
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a branch from `main`
2. **Follow coding standards** - ensure your code adheres to the project's style guide
3. **Test thoroughly** - verify your changes work as expected
4. **Submit a pull request** with a clear description of your changes

### Contribution Guidelines

- Keep commits focused and atomic
- Write clear commit messages
- Ensure all checks pass (`bun run check`, `bun run lint`)
- Update documentation if needed
- Test your changes in both development and production builds

## License

This project is licensed under the [Apache License 2.0](LICENSE).
