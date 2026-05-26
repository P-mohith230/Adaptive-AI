# AdaptiveAI — Complete Requirements From Your Side

Everything the platform needs from you to go from demo mode → fully live production.

---

## 1. AI API Keys (Core Intelligence Engine)

These power the multi-agent reasoning pipeline — the brain of the platform.

> [!IMPORTANT]
> You need **at least one** of these. The system auto-detects which are available and uses them.

| # | Key | Where to Get | What It Powers | Priority |
|---|-----|-------------|----------------|----------|
| 1 | `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | GPT-4o — Primary reasoning engine for all 6 agents (Workflow, Research, Sentiment, Trend, ROI, Strategy) | **Required** (pick at least one AI) |
| 2 | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) | Claude — Alternative/backup reasoning engine, excellent for strategy synthesis | Optional |
| 3 | `GOOGLE_AI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/app/apikey) | Gemini — Alternative reasoning engine | Optional |

### How to add:
Edit `m:\Bytehearts\adaptiveai\backend\.env` and fill in:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxx
```
Then set:
```env
USE_MOCK_AI=false
```

---

## 2. Market Intelligence API Keys (Live Data Feeds)

These power the real-time AI market monitoring — Reddit sentiment, GitHub trends, ProductHunt launches, and news.

> [!NOTE]
> These are **optional for launch**. The platform works with mock/seed data without them. Add them when you want live market intelligence.

| # | Key(s) | Where to Get | What It Powers | Cost |
|---|--------|-------------|----------------|------|
| 4 | `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → Create "script" app | AI tool sentiment analysis from r/MachineLearning, r/artificial, r/ChatGPT, r/LocalLLaMA | **Free** (60 req/min) |
| 5 | `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) → Generate "Fine-grained personal access token" | GitHub star velocity, commit activity, contributor trends for AI tools | **Free** (5000 req/hr) |
| 6 | `PRODUCTHUNT_TOKEN` | [api.producthunt.com/v2/docs](https://api.producthunt.com/v2/docs) → Developer Dashboard | New AI tool launches, upvote velocity, maker activity | **Free** |
| 7 | `NEWS_API_KEY` | [newsapi.org/register](https://newsapi.org/register) | AI industry news, funding rounds, acquisitions, regulatory changes | **Free** (100 req/day) or $449/mo for production |

### How to add:
```env
REDDIT_CLIENT_ID=xxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
PRODUCTHUNT_TOKEN=xxxxxxxxxxxx
NEWS_API_KEY=xxxxxxxxxxxx
ENABLE_LIVE_MARKET_INTELLIGENCE=true
```

---

## 3. XLS Data Files (Already Created ✅)

These are your "database tables" — they're already seeded with demo data and live at `m:\Bytehearts\adaptiveai\backend\data\`:

| File | Purpose | Status |
|------|---------|--------|
| `ORGANIZATIONS_MASTER.xlsx` | Organization profiles, industry, size, maturity scores | ✅ Seeded |
| `AI_TOOLS_MASTER.xlsx` | 150+ AI tools with categories, pricing, trust scores | ✅ Seeded |
| `RECOMMENDATIONS_MASTER.xlsx` | AI stack recommendations per organization | ✅ Seeded |
| `ALERTS_MASTER.xlsx` | AI market alerts (new tools, deprecations, security) | ✅ Seeded |
| `MARKET_INTELLIGENCE_MASTER.xlsx` | Market velocity, sentiment, trend data | ✅ Seeded |
| `DIGITAL_TWIN_MASTER.xlsx` | Department-level AI adoption mappings | ✅ Seeded |
| `AGENT_REASONING_MASTER.xlsx` | Multi-agent reasoning logs and outputs | ✅ Seeded |
| `USERS_MASTER.xlsx` | User accounts and authentication | ✅ Seeded |

> [!TIP]
> You can edit these Excel files directly to add/modify data. The backend reads them on every request — no restart needed.

---

## 4. Environment Configuration

### Backend `.env` (already at `m:\Bytehearts\adaptiveai\backend\.env`)

```env
# ── App ──────────────────────────────────────────────
APP_NAME=AdaptiveAI
APP_VERSION=0.1.0
ENVIRONMENT=development        # Change to "production" for deployment
DEBUG=true                      # Set false in production

# ── Storage ──────────────────────────────────────────
STORAGE_BACKEND=xls             # Change to "sql" when migrating to PostgreSQL
DATA_DIR=./data

# ── Authentication ───────────────────────────────────
JWT_SECRET_KEY=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING_IN_PRODUCTION

# ── CORS ─────────────────────────────────────────────
CORS_ORIGINS=["http://localhost:3000","https://your-domain.com"]

# ── AI APIs (fill at least one) ──────────────────────
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
USE_MOCK_AI=true               # Set false after adding an AI key

# ── AI Model Config ─────────────────────────────────
DEFAULT_AI_MODEL=gpt-4o         # Options: gpt-4o, claude-3-sonnet, gemini-pro
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4096

# ── Market Intelligence (optional) ──────────────────
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
GITHUB_TOKEN=
PRODUCTHUNT_TOKEN=
NEWS_API_KEY=
ENABLE_LIVE_MARKET_INTELLIGENCE=false   # Set true after adding keys
```

### Frontend `.env.local` (already at `m:\Bytehearts\adaptiveai\frontend\.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> [!WARNING]
> For production deployment, change `NEXT_PUBLIC_API_URL` to your backend's public URL (e.g., `https://api.adaptiveai.io/api/v1`).

---

## 5. Production Deployment Requirements (When Ready)

### Option A: Vercel + Railway (Recommended for MVP)

| Component | Platform | What You Need |
|-----------|----------|---------------|
| Frontend | **Vercel** | GitHub repo connected, `NEXT_PUBLIC_API_URL` env var set to backend URL |
| Backend | **Railway** | GitHub repo connected, all `.env` vars added in Railway dashboard |
| Database | **Railway PostgreSQL** | Set `STORAGE_BACKEND=sql` and `DATABASE_URL=postgresql://...` |
| Domain | Any registrar | Custom domain pointed to Vercel (frontend) + Railway (backend) |

### Option B: AWS / GCP / Azure

| Component | Service | What You Need |
|-----------|---------|---------------|
| Frontend | S3 + CloudFront / Cloud Run | Build with `npm run build`, deploy static files |
| Backend | EC2 / Cloud Run / App Service | Python 3.11+, `pip install -r requirements.txt` |
| Database | RDS PostgreSQL / Cloud SQL | Migration from XLS when ready |

---

## 6. Summary Checklist

### Must-Have (to go live):

- [ ] **1 AI API Key** — OpenAI OR Anthropic OR Google AI (pick one)
- [ ] **Set `USE_MOCK_AI=false`** in backend `.env`
- [ ] **Change `JWT_SECRET_KEY`** to a random 64-char string for production

### Nice-to-Have (for full intelligence):

- [ ] Reddit API credentials (free) — for sentiment analysis
- [ ] GitHub personal access token (free) — for repo trend tracking
- [ ] ProductHunt API token (free) — for new tool detection
- [ ] NewsAPI key (free tier) — for industry news monitoring
- [ ] Set `ENABLE_LIVE_MARKET_INTELLIGENCE=true`

### For Production:

- [ ] Custom domain
- [ ] Hosting platform (Vercel + Railway recommended)
- [ ] PostgreSQL database (migrate from XLS)
- [ ] SSL certificate (auto with Vercel/Railway)

---

> [!TIP]
> **Quickest path to a working demo**: Just add `OPENAI_API_KEY` and set `USE_MOCK_AI=false`. Everything else can wait.
