# Appliance Match Engine

A full-stack TypeScript application that uses AI to extract kitchen equipment specifications from PDF documents, semantically match them against a standardized device catalog, and let users interactively select the best-fitting products from a database.

Built with a **LangGraph.js agentic workflow** that orchestrates multi-step AI processing with human-in-the-loop decision making.

## Architecture

```
┌─────────────────────────────┐       REST API        ┌──────────────────────────────┐
│         Frontend            │◄──────────────────────►│          Backend             │
│   Next.js  ·  React  ·  TS │   /api/session/*       │   Express  ·  LangGraph.js   │
│   Tailwind CSS              │                        │   Drizzle ORM  ·  Gemini AI  │
└─────────────────────────────┘                        └──────────┬───────────────────┘
                                                                  │
                                                        ┌─────────▼─────────┐
                                                        │    PostgreSQL     │
                                                        └───────────────────┘
```

### LangGraph Workflow

The backend orchestrates a stateful, multi-step AI pipeline using LangGraph.js:

```
START ──► start_node ──► extraction_node ──► matcher_node ──┐
                              (Gemini AI)      (Gemini AI)  │
                                                            ▼
                                                   ┌─ lookup ──► find_devices_prep ──► human_select_device ─┐
                                                   │                      ▲                                 │
                                                   │                      └──── continue ◄──────────────────┘
                                            lookup_or_save                           │
                                                   │                                end
                                                   └─ save ──► saver_node ──► END    │
                                                                                     ▼
                                                                                    END
```

**Key design:** The graph **interrupts execution** at the `human_select_device` node, returning control to the frontend so the user can review candidates and make a selection. The graph then **resumes** with the user's choice via `Command({ resume })`. This interrupt/resume loop repeats for each device.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js, React, TypeScript | Interactive UI with file upload and device selection |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Express.js, TypeScript | REST API server |
| **AI Orchestration** | LangGraph.js | Stateful agentic workflow with human-in-the-loop |
| **LLM** | Google Gemini 2.5 Flash | PDF extraction and semantic matching |
| **Database** | PostgreSQL + Drizzle ORM | Device storage with type-safe queries |
| **Monorepo** | npm workspaces | Shared dependency management |

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.ts              # Express server entry point
│       ├── routes/session.ts     # REST API (start, resume, export)
│       ├── graph/
│       │   ├── state.ts          # LangGraph state annotation
│       │   ├── nodes.ts          # 6 graph node functions
│       │   ├── edges.ts          # Conditional routing logic
│       │   └── builder.ts        # Graph assembly and compilation
│       ├── services/learner.ts   # Gemini API integration
│       ├── db/
│       │   ├── schema.ts         # Drizzle table definitions
│       │   ├── client.ts         # Database connection
│       │   └── queries.ts        # Type-safe CRUD operations
│       └── types/device.ts       # Shared TypeScript interfaces
├── frontend/
│   ├── app/page.tsx              # Main page (upload → select → export)
│   ├── lib/api.ts                # Backend API client
│   └── types/device.ts           # Frontend type definitions
├── package.json                  # npm workspaces root
└── tsconfig.base.json            # Shared TypeScript config
```

## How It Works

1. **Upload** -- User uploads a kitchen equipment PDF specification
2. **Extract** -- Gemini AI extracts all devices with dimensions, descriptions, and prices
3. **Match** -- Gemini semantically matches each device to a standardized catalog of 360+ device types
4. **Select** -- For each matched device, the user reviews candidates from the database sorted by dimensional similarity and picks the best fit
5. **Export** -- Final selections are compiled for export

## API Design

Session-based REST API supporting the interrupt/resume pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/session/start` | Upload PDF, start graph processing |
| `POST` | `/api/session/:id/resume` | Resume graph with device selection |
| `GET` | `/api/session/:id/export` | Export selected devices |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (via Docker)
- Google Gemini API key

### Setup

```bash
# Clone and install
git clone https://github.com/reiamt/appliance_match_engine
cd appliance_match_engine
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY

# Start PostgreSQL
docker compose up -d

# Push database schema
cd backend && npx drizzle-kit push && cd ..

# Run both services
npm run dev --workspace=backend   # http://localhost:3001
npm run dev --workspace=frontend  # http://localhost:3000
```

## License

MIT
