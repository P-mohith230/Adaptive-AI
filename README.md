<p align="center">
  <img src="https://img.shields.io/badge/AdaptiveAI-v1.0.0-9f7aea?style=for-the-badge&logo=brain&logoColor=white" alt="Version">
  <img src="https://img.shields.io/badge/Status-Live-00E5A8?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Agents-6_Specialized-F59E0B?style=for-the-badge" alt="Agents">
  <img src="https://img.shields.io/badge/Models-3_LLMs-EF4444?style=for-the-badge" alt="Models">
  <img src="https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey?style=for-the-badge" alt="License">
</p>

<h1 align="center">🧠 AdaptiveAI</h1>
<p align="center"><strong>AI-Native Operational Intelligence Platform for Startups</strong></p>

<p align="center">
  <em>A state-of-the-art multi-agent reasoning system that helps startups discover, evaluate, and adopt the right AI infrastructure—powered by 6 specialized agents, 3 LLM models, real-time Google Sheets database integration, and an interactive 3D orbital visualization engine.</em>
</p>

<p align="center">
  Developed for the <strong>ByteHearts × Ranovex AI Product Hackathon 2026</strong><br/>
  Designed & Engineered by <strong>PAGADALA MOHITH ans S.NIKHIL REDDY</strong>
</p>

---

## 🎯 Vision & Mission

* **The Problem:** Modern startup founders are overwhelmed by over 1,000+ AI tools flooding the market. They waste valuable engineering months evaluating tools that fail to fit their workflows, overpay for underutilized SaaS subscriptions, and overlook emerging open-source models that could dramatically enhance their product velocity.
* **Our Solution:** **AdaptiveAI** serves as an automated, CTO-level strategic consultant. By deploying a pipeline of 6 specialized AI reasoning agents, it automates bottleneck analysis, performs target SaaS matching, scores community sentiment, forecasts technology longevity, generates precise ROI projections, and designs custom, step-by-step AI roadmaps.
* **Our Mission:** To democratize AI adoption intelligence, enabling startups of all sizes—from early-stage bootstrapped teams to high-velocity scaleups—to make data-driven, strategic decisions regarding their AI infrastructure.

---

## 🏗️ System & Feature Architecture

### 1. High-Level System Architecture
The system employs a decoupled, asynchronous architecture separating the Next.js 16/React 19 client from the FastAPI/Python backend service layer.

<p align="center">
  <img src="./assets/system_architecture.png" alt="AdaptiveAI System Architecture" width="100%">
</p>

<details>
<summary>📂 View Mermaid Source</summary>

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (Next.js 16 + React 19)"]
        LP[Landing Page<br/>3D Hero + GSAP Animations]
        AUTH[Auth Flow<br/>Login / Signup]
        OB[Onboarding<br/>Startup Profile Builder]
        DASH[Dashboard<br/>Organization Overview]
        CONSULT[AI Consultant<br/>Chat + 3D Orbit]
        AGENTS_PAGE[Agent Pipeline<br/>Execution Viewer]
        MARKET[Market Intelligence<br/>Trend Dashboard]
    end

    subgraph Backend["⚙️ Backend (FastAPI + Python)"]
        API[REST API v1<br/>Routes & Middleware]
        ORCH[Agent Orchestrator<br/>Central Coordinator]
        SERVICES[Service Layer<br/>Business Logic]
        STORAGE[Storage Layer<br/>Repository Pattern]
    end

    subgraph Agents["🤖 Multi-Agent Pipeline"]
        WA[Workflow Agent<br/>Llama 4 Scout]
        RA[Research Agent<br/>Groq Compound]
        SA[Sentiment Agent<br/>Llama 3.3 70B]
        TA[Trend Agent<br/>Llama 3.3 70B]
        ROI[ROI Agent<br/>Groq Compound]
        STRAT[Strategy Agent<br/>Llama 4 Scout]
    end

    subgraph Data["💾 Data Layer"]
        GS[Google Sheets<br/>8 Master Worksheets]
        XLS[Local Excel<br/>Fallback Storage]
    end

    subgraph AI["🧠 AI Providers"]
        GROQ[Groq API<br/>3 Models]
        OR[OpenRouter<br/>Fallback]
    end

    Frontend --> API
    API --> ORCH
    API --> SERVICES
    ORCH --> Agents
    SERVICES --> STORAGE
    STORAGE --> Data
    Agents --> AI
    ORCH --> STORAGE

    style Frontend fill:#1a1a2e,stroke:#8B5CF6,color:#fff
    style Backend fill:#16213e,stroke:#3B82F6,color:#fff
    style Agents fill:#0f3460,stroke:#00E5A8,color:#fff
    style Data fill:#1a1a2e,stroke:#F59E0B,color:#fff
    style AI fill:#16213e,stroke:#EF4444,color:#fff
```
</details>

---

### 2. Multi-Agent Orchestration Flow
The reasoning engine functions across a combination of parallel execution threads, dependent evaluation loops, and a final synthesis stage.

<p align="center">
  <img src="./assets/agent_orchestration.png" alt="Multi-Agent Orchestration Flow" width="100%">
</p>

<details>
<summary>📂 View Mermaid Source</summary>

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant WorkflowAgent as 🔧 Workflow Agent
    participant ResearchAgent as 🔍 Research Agent
    participant SentimentAgent as 💬 Sentiment Agent
    participant TrendAgent as 📈 Trend Agent
    participant ROIAgent as 💰 ROI Agent
    participant StrategyAgent as 🧠 Strategy Agent
    participant GoogleSheets as 📊 Google Sheets

    User->>Orchestrator: Submit query
    
    Note over Orchestrator: Phase 1 — Parallel Analysis
    par Parallel Execution
        Orchestrator->>WorkflowAgent: Analyze bottlenecks
        Orchestrator->>ResearchAgent: Match AI tools
        Orchestrator->>SentimentAgent: Assess community trust
        Orchestrator->>TrendAgent: Forecast trends
    end
    
    WorkflowAgent-->>Orchestrator: Workflow analysis
    ResearchAgent-->>Orchestrator: Tool recommendations
    SentimentAgent-->>Orchestrator: Sentiment scores
    TrendAgent-->>Orchestrator: Trend predictions
    
    Note over Orchestrator: Phase 2 — Dependent Analysis
    Orchestrator->>ROIAgent: Calculate ROI (needs research results)
    ROIAgent-->>Orchestrator: Financial projections
    
    Note over Orchestrator: Phase 3 — Strategic Synthesis
    Orchestrator->>StrategyAgent: Synthesize all agent outputs
    StrategyAgent-->>Orchestrator: Unified roadmap
    
    Orchestrator->>GoogleSheets: Store reasoning chain
    Orchestrator-->>User: Comprehensive AI strategy response
```
</details>

---

### 3. Dual-Layer Storage & Sync Flow
To achieve industrial-grade reliability, AdaptiveAI uses a live Cloud-Local Hybrid storage model. Google Sheets acts as a serverless cloud DB, backed by a local Excel offline database with automatic fallback and state recovery.

```mermaid
flowchart TD
    subgraph Client["🖥️ Frontend Client Layout"]
        UI[User Dashboard / Chat Interface]
        Onboard[Profile & Onboarding Wizard]
    end

    subgraph Backend["⚙️ FastAPI Backend Services"]
        API[API Router Layer]
        Repo[Storage Repository Pattern]
        SheetMgr[Unified Sheet Manager]
        AgentOrch[Agent Orchestrator]
    end

    subgraph DataLayer["💾 Dual-Layer Storage Architecture"]
        GS[(Google Sheets Cloud Database<br/>8 Master Worksheets)]
        XLS[(Local Excel Database<br/>8 Offline Files)]
    end

    UI & Onboard -->|HTTP Requests + JWT| API
    API -->|Trigger Reasoning| AgentOrch
    AgentOrch -->|Save Reasoning Chain| Repo
    API -->|Write/Read States| Repo
    Repo -->|Direct Access| SheetMgr
    
    SheetMgr -->|Ping Google API: Online| GS
    SheetMgr -->|Fallback: API Timeout / Offline| XLS
    XLS -.->|On System Startup: Sync Delta| GS

    classDef client fill:#1e1e2e,stroke:#cba6f7,color:#cdd6f4;
    classDef backend fill:#11111b,stroke:#89b4fa,color:#cdd6f4;
    classDef storage fill:#181825,stroke:#fab387,color:#cdd6f4;
    class Client client;
    class Backend backend;
    class DataLayer storage;
```

---

### 4. Market Intelligence Scraper Pipeline (New)
A robust scraping loop gathers telemetry data from developer ecosystems, public forums, and news engines to calculate real-time trust and viability indexes for matched AI solutions.

```mermaid
flowchart LR
    subgraph Sources["🌐 Public Market Signals"]
        RD[Reddit API / Scrapers<br/>r/artificial, r/SaaS]
        GH[GitHub REST API<br/>Repo Stars & Activity]
        PH[ProductHunt API<br/>Daily Standings]
        HN[Hacker News Feeds<br/>Developer Sentiment]
    end

    subgraph Scraper["🕵️ Scraper Engine (FastAPI)"]
        HTTP[Async HTTPX Client]
        BS4[BeautifulSoup4 Parser]
        Sentiment[Vader Sentiment Evaluator]
    end

    subgraph DB["📊 Sheets Master Registry"]
        MIT[(MARKET_INTELLIGENCE_MASTER)]
        ATM[(AI_TOOLS_MASTER)]
    end

    subgraph View["🖥️ Client View Layer"]
        Scores[AI Trust & Longevity Metrics]
        Signals[Real-Time Trend Dashboard]
    end

    RD & GH & PH & HN -->|Raw Scrapes / Feeds| HTTP
    HTTP --> BS4
    BS4 --> Sentiment
    Sentiment -->|Update Trust & sentiment Scores| MIT & ATM
    MIT & ATM -->|REST endpoints| View

    classDef sources fill:#24283b,stroke:#f7768e,color:#a9b1d6;
    classDef scraper fill:#1f2335,stroke:#7aa2f7,color:#a9b1d6;
    classDef db fill:#1a1b26,stroke:#9ece6a,color:#a9b1d6;
    classDef view fill:#24283b,stroke:#bb9af7,color:#a9b1d6;
    class Sources sources;
    class Scraper scraper;
    class DB db;
    class View view;
```

---

### 5. Startup Digital Twin & Bottleneck Analysis (New)
The platform maps the operational layers of the startup into an interactive "Digital Twin". AI agents evaluate this representation to proactively highlight system vulnerabilities, tooling inefficiencies, and automation ROI.

```mermaid
flowchart TD
    subgraph Input["🏢 Onboarding Data Inputs"]
        Profile[Startup Profile Form]
        Workflows[SaaS Dependency Chain]
        Costs[Operational Cost & Overhead]
    end

    subgraph TwinEngine["🔄 Digital Twin Constructor"]
        TwinBuilder[Twin Structural Assembler]
        DepMap[Virtual Workflow Dependency Graph]
    end

    subgraph Logic["🤖 Analysis & Projection Pipeline"]
        WA[🔧 Workflow Agent<br/>Bottleneck Analyzer]
        ROI[💰 ROI Agent<br/>Financial Forecaster]
        RECS[💡 Matching Engine]
    end

    subgraph Output["📈 Actionable Roadmap"]
        TwinSheet[(DIGITAL_TWIN_MASTER)]
        Maturity[AI Adoption Maturity Score]
        Roadmap[Interactive Transition Plan]
    end

    Input --> TwinBuilder
    TwinBuilder --> DepMap
    DepMap --> WA
    WA -->|Detect Bottlenecks| RECS
    RECS -->|Project Savings| ROI
    WA & ROI & RECS -->|Build Twin State| TwinSheet
    TwinSheet --> Maturity
    Maturity --> Roadmap

    classDef in fill:#1e1e2e,stroke:#cba6f7,color:#cdd6f4;
    classDef twin fill:#302d41,stroke:#f5e0dc,color:#cdd6f4;
    classDef logic fill:#181825,stroke:#f9e2af,color:#cdd6f4;
    classDef out fill:#1e1e2e,stroke:#a6e3a1,color:#cdd6f4;
    class Input in;
    class TwinEngine twin;
    class Logic logic;
    class Output out;
```

---

### 6. Interactive 3D Orbital Visualization Architecture
The consultant module uses an advanced spatial design layout: the left panel hosts a high-frequency chat panel, while the right panel renders a live Three.js 3D system state tracking active agents, active model nodes, and processing weights.

<p align="center">
  <img src="./assets/orbital_visualization.png" alt="3D Orbital Visualization Architecture" width="100%">
</p>

<details>
<summary>📂 View Mermaid Source</summary>

```mermaid
graph LR
    subgraph ThreeJS["Three.js / React Three Fiber"]
        CANVAS[R3F Canvas<br/>WebGL Renderer]
        CORE[Central Orchestrator<br/>Glowing Nucleus]
        N1[🔧 Workflow Node]
        N2[🔍 Research Node]
        N3[💬 Sentiment Node]
        N4[📈 Trend Node]
        N5[💰 ROI Node]
        N6[🧠 Strategy Node]
    end

    subgraph Fallback["CSS Fallback"]
        CSS_ORBIT[CSS Orbital Animation<br/>SVG + Keyframes]
    end

    subgraph States["Agent States"]
        IDLE[⚪ Idle - Dimmed]
        ACTIVE[🟡 Active - Pulsing]
        DONE[🟢 Done - Glowing]
        ERROR[🔴 Error - Flashing]
    end

    CANVAS --> CORE
    CORE --> N1 & N2 & N3 & N4 & N5 & N6
    N1 & N2 & N3 & N4 & N5 & N6 --> States
    
    style ThreeJS fill:#050409,stroke:#8B5CF6,color:#fff
    style Fallback fill:#1a1a2e,stroke:#3B82F6,color:#fff
    style States fill:#0f3460,stroke:#00E5A8,color:#fff
```
</details>

---

## 🛠️ Technology Stack

| Architecture Layer | Core Technologies | Strategic Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.2 (Turbopack), React 19 | Fast Server Components, optimized client bundle compilation |
| **3D Rendering Engine** | Three.js, React Three Fiber (R3F), Drei | Real-time GPU-accelerated spatial agent nodes & orbital glow |
| **Micro-Animations** | GSAP, Framer Motion | Smooth landing scene transitions, timeline animations, micro-reveals |
| **Global State Manager** | Zustand v5 | Fast, centralized client-side store without excessive re-renders |
| **Design System** | Vanilla CSS + CSS Variables | Pixel-perfect customized dark theme without utility-class clutter |
| **Charts & Metrics** | Recharts | Interactive financial charts, timeline ROI, & growth curves |
| **Vector Icons** | Lucide React | Clean, scalable visual symbols across all tool features |
| **Backend Framework** | FastAPI (Python 3.11) | Async high-concurrency routing, auto Swagger generation |
| **Database Engines** | Google Sheets API (via gspread) | Serverless, highly visual cloud spreadsheet database (8 sheets) |
| **Fallback DB Engine** | Local Excel Storage (openpyxl) | Offline database synchronization, resilient pipeline state |
| **Security & Auth** | JSON Web Tokens (JWT), bcrypt | Secure stateless organization scoping and password hashing |
| **Data Scraper** | Async HTTPX, BeautifulSoup4 | Scrapes Reddit, GitHub, Hacker News for real-time market data |
| **Schema Validation** | Pydantic v2 | Strict endpoint schema assertion and clean error payloads |

---

## ✨ Features Deep Dive

### 🤖 Multi-Agent AI Consultant (Multi-Model Bagger Architecture)
Rather than relying on a single generalist LLM, AdaptiveAI utilizes a custom **Multi-Model Bagger** pipeline. Each agent executes a highly tailored prompt on a specific model, yielding superior accuracy, speed, and latency optimizations.

```mermaid
graph TD
    QUERY[User Query] --> ORCH[Agent Orchestrator]
    
    subgraph Phase1["Phase 1 — Parallel Analysis"]
        WA["🔧 Workflow Agent<br/>Llama 4 Scout 17B"]
        RA["🔍 Research Agent<br/>Groq Compound"]
        SA["💬 Sentiment Agent<br/>Llama 3.3 70B"]
        TA["📈 Trend Agent<br/>Llama 3.3 70B"]
    end
    
    subgraph Phase2["Phase 2 — Dependent Analysis"]
        ROI["💰 ROI Agent<br/>Groq Compound"]
    end
    
    subgraph Phase3["Phase 3 — Synthesis"]
        STRAT["🧠 Strategy Agent<br/>Llama 4 Scout 17B"]
    end
    
    ORCH --> WA & RA & SA & TA
    RA --> ROI
    WA & RA & SA & TA & ROI --> STRAT
    STRAT --> RESPONSE[Strategic Roadmap]
    
    style Phase1 fill:#0f3460,stroke:#3B82F6,color:#fff
    style Phase2 fill:#16213e,stroke:#F59E0B,color:#fff
    style Phase3 fill:#1a1a2e,stroke:#00E5A8,color:#fff
```

* **Workflow Intelligence Agent (Llama 4 Scout 17B):** Parses organization structures, identifying operational bottlenecks and friction loops.
* **Tool Research Agent (Groq Compound):** Matches tools based on current technology stacks, pricing, integration requirements, and security levels.
* **Sentiment Intelligence Agent (Llama 3.3 70B):** Evaluates public developer repositories and community forums to measure software reliability and support levels.
* **Trend Tracking Agent (Llama 3.3 70B):** Monitors open-source repository velocity and news streams to predict platform obsolescence risks.
* **ROI Estimation Agent (Groq Compound):** Calculates operational payback timelines, time-to-value metrics, and subscription replacement savings.
* **Strategy Synthesis Agent (Llama 4 Scout 17B):** Combines individual analysis outputs into a clean transition roadmap.

* **Failover Chain Resilience:** If the primary Groq model encounters rate limits or service timeouts, agents automatically route through a structured fallback chain:
  ```
  Primary Model ➔ Llama 3.3 70B ➔ Llama 4 Scout ➔ OpenRouter Backup ➔ Smart Mock Service
  ```

---

### 📊 Cloud-Native Google Sheets Integration
AdaptiveAI features a relational database structure mapped directly onto **8 master worksheets** in Google Sheets, allowing teams to view and manipulate application data live:
1. `USERS_MASTER` — Authenticated accounts, cryptographically hashed passwords.
2. `ORGANIZATIONS_MASTER` — Organization onboarding configurations, departments, processes, and tech friction tags.
3. `AI_TOOLS_MASTER` — A registry of 150+ monitored tools including categorized features, pricing, and live API endpoints.
4. `RECOMMENDATIONS_MASTER` — Detailed structural and technical matches generated by the agent pipeline.
5. `ALERTS_MASTER` — Operational warnings (pricing changes, active vulnerabilities, service deprecations).
6. `MARKET_INTELLIGENCE_MASTER` — Live metrics scraped from developer forums, HN, and GitHub.
7. `AGENT_REASONING_MASTER` — Execution logs and token audit trails for every pipeline execution.
8. `DIGITAL_TWIN_MASTER` — State structures tracking startup workflow nodes and mapped bottlenecks.

---

## 🚀 Installation & Local Deployment Guide

### Prerequisites
* **Node.js** ≥ 18.x (LTS recommended)
* **Python** ≥ 3.11
* **Groq API Key** — Sign up via [console.groq.com](https://console.groq.com)
* **Google Cloud Account** (Optional) — Service account credentials for Google Sheets integration.
* **Git**

---

### Step-by-Step Setup

#### 1. Clone the Project
```bash
git clone https://github.com/PagadalaMohith/adaptiveai.git
cd adaptiveai
```

#### 2. Backend Environment Configuration
```bash
# Navigate to the backend directory
cd backend

# Initialize your Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install all backend dependencies
pip install -r requirements.txt
```

Create a new file named `.env` in the `backend/` directory:
```env
# Core Application Settings
APP_NAME=AdaptiveAI
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=false

# Storage Backend Mode (options: xls / google_sheets)
STORAGE_BACKEND=google_sheets
SEED_ON_STARTUP=false

# LLM Providers Configuration
USE_MOCK_AI=false
GROQ_API_KEY=your_groq_api_key_here

# Cryptography & Token Configuration
JWT_SECRET_KEY=your_secure_secret_key_here

# Google Sheets API Credentials
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nService\nAccount\nKey\n-----END PRIVATE KEY-----\n"

# Web Scraping Keys (Optional APIs)
GITHUB_TOKEN=your_github_personal_access_token
NEWS_API_KEY=your_news_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

#### 3. Frontend Environment Configuration
```bash
# Navigate to the frontend directory
cd ../frontend

# Install node dependencies
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Running the Application Locally

For local development, open **two separate terminal shells** with active environments:

* **Terminal 1: Start Python API Server**
  ```bash
  cd backend
  # Ensure your virtual environment is active
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```

* **Terminal 2: Start Next.js Development Server**
  ```bash
  cd frontend
  npm run dev
  ```

---

### Access Ports & Dashboards

| Service Interface | Target URL | Description |
| :--- | :--- | :--- |
| **Next.js Client Web App** | `http://localhost:3000` | Landing Page, Onboarding, Agent Visualization Panel, Consultant Room |
| **API Interactive Swagger** | `http://localhost:8000/docs` | Interactive OpenAPI playground |
| **System Redoc Documentation** | `http://localhost:8000/redoc` | High-fidelity API structure documentation |
| **Backend Health Check** | `http://localhost:8000/health` | Dual-storage connection status and sheets integrity health check |

---

## 📡 API Reference Catalog

### 🔐 Authentication System

* <kbd>POST</kbd> `/api/v1/auth/signup`
  Registers a new user and configures their organizational database profile.
* <kbd>POST</kbd> `/api/v1/auth/login`
  Authenticates user credentials, returning a stateless JWT access token.

### 🏢 Startup Profile Management

* <kbd>POST</kbd> `/api/v1/organizations/onboard`
  Submits organization details (scale, departments, workflows, tech stack).
* <kbd>GET</kbd> `/api/v1/organizations/{id}`
  Retrieves current organization profile metrics.
* <kbd>PATCH</kbd> `/api/v1/organizations/{id}`
  Updates tech stack information, pain points, or scale metrics.

### 🤖 Core Agent Consulting & Reasoners

* <kbd>POST</kbd> `/api/v1/agents/consult`
  Initiates chat streams with the AI consultant. Triggers real-time agent status changes in the 3D visualizer.
* <kbd>POST</kbd> `/api/v1/agents/analyze/{org_id}`
  Triggers a full multi-agent analysis cycle (Workflow, Research, Sentiment, Trends, ROI, Strategy).
* <kbd>GET</kbd> `/api/v1/agents/reasoning/{id}`
  Fetches the complete step-by-step reasoning chain and model logs.

### 📈 Market Intelligence

* <kbd>GET</kbd> `/api/v1/market/tools`
  Queries the registry of AI tools with filters for categorization, trust thresholds, and capabilities.
* <kbd>GET</kbd> `/api/v1/market/tools/{id}`
  Returns detailed metadata, security status, and pricing details for a specific AI tool.
* <kbd>GET</kbd> `/api/v1/market/intelligence`
  Retrieves real-time trend data scraped from ProductHunt, Reddit, and GitHub.
* <kbd>POST</kbd> `/api/v1/market/scrape`
  Triggers an on-demand market scraping run (restricted to administrators).

### 💡 Recommendations & Operational Alerts

* <kbd>GET</kbd> `/api/v1/recommendations/{org_id}`
  Retrieves the list of matched AI tools, workflow integrations, and ROI projections.
* <kbd>GET</kbd> `/api/v1/alerts/{org_id}`
  Returns active alerts (tool deprecation risk, security patches, price updates).

---

## 📁 Repository Structure

```
adaptiveai/
├── backend/
│   ├── .env                            # Sensitive keys & variables (ignored)
│   ├── requirements.txt                # Curated Python modules
│   ├── data/                           # Fallback local Excel storage (.xlsx files)
│   └── app/
│       ├── main.py                     # FastAPI application factory
│       ├── config.py                   # Pydantic schema environment configuration
│       ├── seed.py                     # Mock data & catalog seeding module
│       ├── agents/
│       │   ├── orchestrator.py         # Multi-agent process lifecycle coordinator
│       │   ├── base_agent.py           # Core abstract class representing pipeline nodes
│       │   ├── workflow_agent.py       # Focuses on user bottlenecks
│       │   ├── research_agent.py       # Matches appropriate tools
│       │   ├── sentiment_agent.py      # Scores community sentiment
│       │   ├── trend_agent.py          # Monitors tool longevity
│       │   ├── roi_agent.py            # Financial modeling & saving calculations
│       │   └── strategy_agent.py       # Synthesizes inputs into a roadmap
│       ├── api/v1/
│       │   ├── router.py               # Central route registration
│       │   └── routes/                 # Modular API controllers
│       ├── services/                   # Pure business logic implementation
│       │   ├── auth_service.py         # JWT generation, token checks, hashing
│       │   ├── organization_service.py # Organization data mutation logic
│       │   ├── ai_tool_service.py      # Calculations for AI Trust & Future-Proof scores
│       │   ├── scraper_service.py      # Controls scraper workers
│       │   └── digital_twin_service.py # Structural digital twin mapping logic
│       ├── storage/
│       │   ├── sheet_manager.py        # Connects Google Sheets API and Local Excel
│       │   ├── xls_repository.py       # Native local file interactions (openpyxl)
│       │   └── google_sheets_repository.py # Remote Google Sheets operations
│       └── core/
│           ├── ai_client.py            # AI Bagger routing & LLM fallback operations
│           └── logging.py              # Centralized logging setup
│
├── frontend/
│   ├── package.json                    # Frontend node dependencies
│   ├── .env.local                      # Client public API target
│   └── src/
│       ├── app/
│       │   ├── page.tsx                # High-fidelity dark landing page
│       │   ├── onboard/page.tsx        # Setup wizard
│       │   ├── dashboard/page.tsx      # Main analytics & digital twin dashboard
│       │   ├── consultant/page.tsx     # Splitted-screen chat + Three.js 3D orbit
│       │   └── agents/page.tsx         # Real-time visual monitoring of pipeline
│       ├── components/
│       │   ├── AgentOrbit3D.tsx        # WebGL orbital scene (React Three Fiber)
│       │   ├── HeroScene3D.tsx         # 3D Landing Page scene
│       │   └── AuthShield.tsx          # Client-side protected routes guard
│       └── lib/
│           ├── api/client.ts           # Fetch API wrapper
│           └── stores/appStore.ts      # App state manager (Zustand)
│
└── docs/                               # 7 Master Product & Design Docs (.docx files)
```

---

## 🗺️ Project Evolution Roadmap

| Timeline Phase | Feature Milestone | Target Objective | Status |
| :--- | :--- | :--- | :--- |
| **Hackathon v1.0** | Core Multi-Agent Platform | Interactive chat, 3D WebGL orbit, Google Sheets database |  Live |
| **Hackathon v1.0** | Resilient Storage Engine | Cloud-Local hybrid persistence with Excel database fallbacks |  Live |
| **Hackathon v1.0** | Real-time Market Scraper | Continuous data scraping of Reddit, HN, and GitHub stars |  Live |
| **Upcoming v1.1** | Native PostgreSQL Sync | Enterprise-grade PostgreSQL adapter option with auto-sync | 🔜 Scheduled |
| **Upcoming v1.1** | WebSocket Chat Streams | Live token-by-token text streaming via WebSocket connections | 🔜 Scheduled |
| **Upcoming v1.2** | Multi-Tenant Spaces | Shared workspaces, department budgets, and multi-user roles | 🔜 Planned |
| **Vision v2.0** | Self-Optimizing Loops | Autonomous self-improving agent runs using local feedback | 🔮 Future Vision |

---

## 🤝 Contribution Guidelines

We welcome community contributions! Please review our development pipeline:

1. **Fork** the primary repository.
2. **Branch out** for your feature: `git checkout -b feature/amazing-feature`
3. **Commit** your modifications following the conventional commits standard:
   * `feat:` for new features or endpoints.
   * `fix:` for code corrections or patches.
   * `docs:` for improvements in documentation.
   * `perf:` for latency optimizations.
4. **Push** your branch: `git push origin feature/amazing-feature`
5. **Open** a clean Pull Request explaining your changes.

---

## 📄 License & Attribution

This project is licensed under the terms of the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](file:///m:/Bytehearts/adaptiveai/LICENSE).

* **Usage Limitations:** You are free to view, download, modify, and run this application for academic, personal, or learning purposes. Commercial redistribution or usage of this codebase is strictly prohibited without explicit written permission from the author.
* **Credits:** AdaptiveAI was developed by **PAGADALA MOHITH** & **S.NIKHIL REDDY** for the **ByteHearts × Ranovex AI Product Hackathon 2026**.

---

<p align="center">
  <strong>Built with ❤️ by team ByteHearts</strong><br/>
  <em>Empowering startup teams with clean, AI-native operational intelligence.</em>
</p>
