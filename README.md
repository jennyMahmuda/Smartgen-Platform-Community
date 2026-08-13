# SmartGen Platform Community

A secure, premium community portal for SmartGen builders to share workflows, ask questions, and recognize helpful contributors.

## Architecture

This project uses a hybrid deployment model to balance public accessibility with secure, private data handling:

- **Frontend**: React 19 + Tailwind 4 + Wouter, hosted on **GitHub Pages**.
- **Backend**: Express + tRPC 11 + Drizzle ORM, hosted on **Manus**.
- **Database**: Managed MySQL/TiDB via Manus.
- **Auth**: Manus OAuth (Email-based) with secure cross-origin session handling.

## Key Features

- **Premium Dark UI**: Deep purple and cyan visual system with responsive layouts.
- **Gated Access**: Fully authenticated community; zero exposure for unauthenticated visitors.
- **Contributor Ratings**: Real-time helpfulness scores and profile badges.
- **Discussion Threads**: Threaded conversations with solution marking and helpfulness reactions.
- **Admin Management**: Secure category creation and reordering for administrators.
- **Automated Notifications**: Secure owner alerts when solutions are accepted.

## Development

### Prerequisites
- Node.js 22+
- pnpm 10+

### Setup
1. Clone the repository.
2. Install dependencies: `pnpm install`.
3. Start the development server: `pnpm run dev`.

### Deployment
- **Frontend**: Automatically deployed to GitHub Pages on every push to `main`.
- **Backend**: Managed and deployed via the Manus platform.
- **Required GitHub Actions variable**: Add the non-secret repository variable `VITE_API_BASE_URL` with the public URL of the published Manus backend, for example `https://community-api.example.com`. The workflow already sets the public Pages URL and never requires API keys in the public repository.

## License
MIT · © 2026 SmartGen
