# Fitness LAB OS

AI-assisted Human Performance Operating System for coaches and members.

## Features (Prototype)

- Coach/Admin dashboard with member phase breakdown (BASE / FITNESS / PERFORMANCE)
- Member management (add/search/select members)
- Recovery daily journal with readiness score + interpretation
- Assessment Lab (classification, body comp, performance, mobility, cardio zones, notes)
- Training log (sets/reps/load + session volume)
- Programming tab (upload plan + simple calendar planning)
- Reports + Admin/Billing placeholder screens

## Tech Stack

- React (Vite)
- Tailwind CSS
- Framer Motion
- lucide-react icons

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (typically `http://localhost:5173`, but Vite may choose the next port if it’s already in use).

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This repo includes a GitHub Actions workflow that builds and deploys the app to GitHub Pages on every push to `main`.

1) In GitHub repo settings → **Pages**:
- Source: **GitHub Actions**

2) Add repository secrets (Settings → Secrets and variables → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are the same values you use locally in `.env.local`. They are required because this is a static Vite build.

## License

MIT — see the LICENSE file.

**Made with ❤️ by [Sarthak Maheshwari](https://github.com/Sarthak1Developer)**
