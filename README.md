# Baro Frontend

React-based frontend for the Baro learner reflection system.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Running Baro backend (Go Fiber)

## Installation

```bash
cd react-genbaro
npm install
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI primitives
- **Charts**: Recharts, Nivo
- **Forms**: React Hook Form + Zod
- **State**: React Context, React Query
- **Routing**: React Router DOM v7
- **HTTP**: Axios

## Project Structure

```
src/
├── app/                    # App router pages (dashboard, etc.)
│   └── dashboard/
├── application/            # Context providers
│   └── contexts/           # AuthContext, UserDataContext
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Login, Signup components
│   ├── reflections-*      # Reflection-related components
│   ├── attendance-*       # Attendance components
│   ├── admin-*            # Admin-only components
│   └── *.tsx              # Other shared components
├── hooks/                 # Custom React hooks
│   ├── use-reflections.ts
│   ├── use-streak-calculation.ts
│   └── use-config.ts
├── routes/
│   └── layouts/           # Route layouts (Admin, Learner, Auth)
├── utils/                 # Utility functions
│   ├── date-utils.ts
│   └── day-colors.ts
└── main.tsx               # Entry point
```

## Key Components

### Authentication
- `AuthContext` - JWT token management, user state
- `login.tsx` - Login form
- `signup.tsx` - Registration form
- `ProtectedRoute.tsx` - Route guards

### Reflections
- `reflection-button.tsx` - Submit today's reflection
- `reflection-card.tsx` - Display reflection
- `reflections-table.tsx` - View past reflections
- `barometer-visual.tsx` - Emoji zone picker (😢😕😐😊😄)
- `feedback-form.tsx` - Admin feedback form

### Attendance
- `attendance-calendar.tsx` - Calendar view
- `attendance-chart.tsx` - Attendance charts
- `student-attendance.tsx` - Student attendance card

### Admin Dashboard
- `admin-users-table.tsx` - User management
- `admin-reflections-table.tsx` - All reflections
- `admin-attendance-calendar.tsx` - Full attendance view
- `dashboard-metrics.tsx` - Analytics widgets
- `weekly-progress-calendar.tsx` - Weekly summary

### Social
- `TodoList.tsx` - Talk board posts
- `improved-feedback-form.tsx` - Comments

### Gamification
- `badge-renderer.tsx` - Display badges
- `achievements-section.tsx` - Achievement showcase
- `streak-components.tsx` - Streak tracking
- `confetti-effect.tsx` - Celebration effects

## Routing

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/` | Dashboard | Auth |
| `/reflections` | Reflections | Auth |
| `/attendance` | Attendance | Auth |
| `/leave-requests` | Leave Requests | Auth |
| `/board` | Talk Board | Auth |
| `/admin` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/attendance` | Attendance Management | Admin |
| `/admin/holidays` | Holiday Management | Admin |

## API Integration

All API calls go through axios. The base URL is configured via `VITE_API_URL`.

Example API call:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth header
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

## Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## Build

```bash
# Production build
npm run build

# Output in dist/
```

## License

ISC
