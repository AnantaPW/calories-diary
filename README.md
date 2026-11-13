# Calorie Diary

A web-based calorie counter diary for dieting, built with **Next.js (App Router)**, **React**, **TypeScript** and **Tailwind CSS v4**.

## Getting started

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script              | What it does                 |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm start`         | Run the production build     |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript check (no emit)   |

## Features (base)

- **Today** (`/`) – calories consumed vs. daily target, macros, meals at a glance
- **Diary** (`/diary`) – log food per meal (breakfast, lunch, dinner, snacks), browse any day
- **History** (`/history`) – month calendar: each logged day shows a line for how it went against the target you had that day; open any day to see what you ate
- **Profile** (`/profile`) – sex, age, height, weight, activity level and goal → BMR, TDEE and daily target (Mifflin–St Jeor), with optional custom target; theme colour, change password, log out

## Accounts and data

Everyone logs in with a username and password. Each person's diary, profile, target history and theme colour are saved as JSON files on the machine running the app:

```
data/
├── users.json          # accounts (passwords stored as scrypt hashes)
├── sessions.json       # active logins (only hashes of the login tokens)
└── users/<id>.json     # one file per person
```

- **Location:** set `DATA_DIR` in `.env.local` (see `.env.example`). Relative paths start from the project folder; the default is `./data`. The folder is in `.gitignore`.
- **Backups:** copy the whole folder. Each person's file can also be restored on its own.
- **Hosting:** needs one server process with a real disk (`npm run build` then `npm start` on your own machine or a VPS). Platforms without a lasting disk, such as Vercel, would lose the data.
- **New accounts:** anyone can use Create account until you set `ALLOW_SIGNUP=false`.
- **Forgotten password:** there's no email, so reset it on the machine that holds the data:

  ```bash
  npm run reset-password -- <username>
  ```

  It asks for the new password twice and logs that account out everywhere.

Diaries saved in the browser by earlier versions can be moved into an account from the notice on the Today page.

## AI input (optional)

The Add food form has two modes: **Manual input** and **AI input**. With AI input you describe the food in up to 52 characters, DeepSeek estimates the name, kcal, protein, carbs and fat (a description that lists several foods or drinks becomes one entry per item), and you review the numbers before choosing to add them.

To enable it, copy `.env.example` to `.env.local`, set `DEEPSEEK_API_KEY`, and restart the dev server. The model defaults to `deepseek-flash` (change it with `DEEPSEEK_MODEL`). The key stays on the server in `src/app/api/estimate/route.ts`.

## Project structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout + navigation
│   ├── page.tsx           # Today dashboard
│   ├── diary/page.tsx     # Daily food log
│   ├── profile/page.tsx   # Body profile & calorie goal
│   ├── history/page.tsx   # Month calendar of past days
│   ├── not-found.tsx
│   └── globals.css        # Tailwind + theme tokens
├── components/            # UI components (Nav, CalorieProgress, FoodEntryForm, MealSection, CalendarMonth, DayDetail, Sheet, Toast, FillLine)
├── hooks/useDiary.ts      # useEntries / useProfile state hooks
├── hooks/useClient.ts     # useToday / useMediaQuery
└── lib/
    ├── types.ts           # Domain types
    ├── calories.ts        # BMR / TDEE / target / totals
    ├── date.ts            # Local date helpers
    └── storage.ts         # Persistence layer (localStorage)
```

## Suggested next steps

- Swap `lib/storage.ts` for a real backend (e.g. Prisma + PostgreSQL/SQLite, or Supabase) and add auth
- Food database / search (e.g. Open Food Facts API) and saved favourite foods
- Weight log and progress charts
- Weekly summaries and streaks
