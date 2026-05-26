"""
AdaptiveAI — Market Intelligence Service
===========================================
Aggregates and processes market signals from multiple sources.
When live APIs are disabled, uses intelligent mock data.
"""

from datetime import datetime
from typing import Optional

from app.storage.sheet_manager import get_sheet_manager
from app.schemas.market_intelligence import (
    MarketIntelligenceCreate, MarketIntelligenceInDB,
    MarketIntelligenceResponse, MarketTrendSummary,
)
from app.core.logging import get_logger

logger = get_logger("market_intelligence_service")



def safe_float(val, default=0.0):
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


class MarketIntelligenceService:
    """Processes and serves market intelligence data."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def record_signal(self, data: MarketIntelligenceCreate) -> MarketIntelligenceResponse:
        """Record a new market intelligence signal."""
        intel = MarketIntelligenceInDB(**data.model_dump())
        await self.sheets.market_intelligence.insert(intel.model_dump())
        return self._to_response(intel.model_dump())

    async def get_trends(self, limit: int = 20) -> list[MarketIntelligenceResponse]:
        """Get latest market intelligence records."""
        records = await self.sheets.market_intelligence.find_all(
            sort_by="created_at", sort_desc=True, limit=limit
        )
        return [self._to_response(r) for r in records]

    async def get_trend_summary(self) -> MarketTrendSummary:
        """Generate aggregated trend summary for dashboard."""
        all_records = await self.sheets.market_intelligence.find_all()

        if not all_records:
            return self._generate_mock_summary()

        # Aggregate by tool
        tool_signals = {}
        for record in all_records:
            tool = str(record.get("tool_name", ""))
            if not tool:
                continue
            if tool not in tool_signals:
                tool_signals[tool] = {
                    "tool_name": tool,
                    "avg_sentiment": 0,
                    "avg_velocity": 0,
                    "total_mentions": 0,
                    "signals": 0,
                }
            tool_signals[tool]["avg_sentiment"] += safe_float(record.get("sentiment_score", 0))
            tool_signals[tool]["avg_velocity"] += safe_float(record.get("trend_velocity", 0))
            tool_signals[tool]["total_mentions"] += safe_int(record.get("community_mentions", 0))
            tool_signals[tool]["signals"] += 1

        # Compute averages
        trending = []
        for tool_data in tool_signals.values():
            n = tool_data["signals"]
            if n > 0:
                tool_data["avg_sentiment"] = round(tool_data["avg_sentiment"] / n, 2)
                tool_data["avg_velocity"] = round(tool_data["avg_velocity"] / n, 2)
            trending.append(tool_data)

        trending.sort(key=lambda x: x["avg_velocity"], reverse=True)

        return MarketTrendSummary(
            trending_tools=trending[:10],
            emerging_categories=["AI Agents", "AI Code Generation", "AI Infrastructure"],
            declining_categories=["Basic Chatbots", "Simple Text Generation"],
            ecosystem_health_score=0.82,
            total_signals_processed=len(all_records),
        )

    async def get_tool_intelligence(self, tool_name: str) -> dict:
        """Get market intelligence for a specific tool."""
        records = await self.sheets.market_intelligence.search(tool_name, ["tool_name"])
        if not records:
            return {
                "tool_name": tool_name,
                "signals_found": 0,
                "message": "No market intelligence data available for this tool",
            }

        avg_sentiment = sum(safe_float(r.get("sentiment_score", 0)) for r in records) / len(records)
        avg_velocity = sum(safe_float(r.get("trend_velocity", 0)) for r in records) / len(records)
        total_mentions = sum(safe_int(r.get("community_mentions", 0)) for r in records)

        return {
            "tool_name": tool_name,
            "signals_found": len(records),
            "avg_sentiment": round(avg_sentiment, 2),
            "avg_velocity": round(avg_velocity, 2),
            "total_mentions": total_mentions,
            "sources": list(set(str(r.get("source_type", "")) for r in records)),
        }

    def _generate_mock_summary(self) -> MarketTrendSummary:
        """Generate mock trend summary when no data exists."""
        return MarketTrendSummary(
            trending_tools=[
                {"tool_name": "Cursor", "avg_sentiment": 0.92, "avg_velocity": 0.95, "total_mentions": 15400},
                {"tool_name": "v0.dev", "avg_sentiment": 0.88, "avg_velocity": 0.91, "total_mentions": 8200},
                {"tool_name": "Bolt.new", "avg_sentiment": 0.85, "avg_velocity": 0.89, "total_mentions": 6800},
                {"tool_name": "Claude", "avg_sentiment": 0.90, "avg_velocity": 0.87, "total_mentions": 22000},
                {"tool_name": "Notion AI", "avg_sentiment": 0.78, "avg_velocity": 0.72, "total_mentions": 9500},
                {"tool_name": "Linear", "avg_sentiment": 0.86, "avg_velocity": 0.68, "total_mentions": 5200},
                {"tool_name": "Midjourney", "avg_sentiment": 0.75, "avg_velocity": 0.65, "total_mentions": 18000},
                {"tool_name": "Perplexity", "avg_sentiment": 0.88, "avg_velocity": 0.82, "total_mentions": 12000},
            ],
            emerging_categories=[
                "AI Code Generation", "AI Agents & Orchestration",
                "AI Infrastructure Platforms", "AI Workflow Automation",
                "AI Knowledge Management",
            ],
            declining_categories=[
                "Basic Chatbot Builders", "Simple Text Generators",
                "Rule-based Automation",
            ],
            ecosystem_health_score=0.85,
            total_signals_processed=0,
        )

    def _to_response(self, data: dict) -> MarketIntelligenceResponse:
        return MarketIntelligenceResponse(
            intelligence_id=data.get("intelligence_id", ""),
            source_type=data.get("source_type", ""),
            source_name=str(data.get("source_name", "")),
            tool_name=str(data.get("tool_name", "")),
            sentiment_score=safe_float(data.get("sentiment_score", 0)),
            trend_velocity=safe_float(data.get("trend_velocity", 0)),
            community_mentions=safe_int(data.get("community_mentions", 0)),
            github_growth=safe_float(data.get("github_growth", 0)),
            producthunt_rank=safe_int(data.get("producthunt_rank", 0)),
            funding_activity=str(data.get("funding_activity", "")),
            created_at=data.get("created_at", datetime.utcnow()),
        )

    async def crawl_live_market_signals(self, startup_type: str = "") -> list[MarketIntelligenceResponse]:
        """
        Scans live market channels (GitHub, News API, Product Hunt) in parallel,
        feeds the raw data into our Groq Sentiment & Trend Analyst Agent,
        synthesizes high-fidelity market signals, and commits them in bulk to Sheet.
        """
        import httpx
        import json
        import asyncio
        from app.config import get_settings
        from app.core.ai_client import get_ai_client
        from app.schemas.market_intelligence import MarketIntelligenceCreate, MarketIntelligenceInDB
        from app.schemas.ai_tool import AIToolInDB

        settings = get_settings()
        ai_client = get_ai_client()
        
        # Load existing tools catalog for validation check
        existing_tools = await self.sheets.ai_tools.find_all()
        existing_names = {str(t.get("tool_name", "")).strip().lower() for t in existing_tools}
        new_catalog_tools = []

        # 1. Fetch live inputs in parallel
        github_repos = []
        news_articles = []
        ph_posts = []

        async def fetch_github():
            try:
                headers = {
                    "User-Agent": "AdaptiveAI-Orchestrator"
                }
                if settings.GITHUB_TOKEN:
                    headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
                q = f"{startup_type} AI" if startup_type else "AI agent SaaS"
                url = f"https://api.github.com/search/repositories?q={q}&sort=stars&order=desc&per_page=6"
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.get(url, headers=headers)
                    if res.status_code == 200:
                        items = res.json().get("items", [])
                        for repo in items:
                            github_repos.append({
                                "name": repo.get("name", ""),
                                "stars": repo.get("stargazers_count", 0),
                                "language": repo.get("language", "Python"),
                                "description": repo.get("description", "")
                            })
            except Exception as e:
                logger.error(f"Market Scraper failed to fetch GitHub: {e}")

        async def fetch_news():
            if settings.NEWS_API_KEY:
                try:
                    q = "AI tool SaaS OR LLM framework OR devin competitor"
                    url = f"https://newsapi.org/v2/everything?q={q}&sortBy=publishedAt&pageSize=5&apiKey={settings.NEWS_API_KEY}"
                    async with httpx.AsyncClient(timeout=6.0) as client:
                        res = await client.get(url)
                        if res.status_code == 200:
                            articles = res.json().get("articles", [])
                            for art in articles:
                                news_articles.append({
                                    "title": art.get("title", ""),
                                    "description": art.get("description", ""),
                                    "source": art.get("source", {}).get("name", "News Feed")
                                })
                except Exception as e:
                    logger.error(f"Market Scraper failed to fetch News API: {e}")

        async def fetch_ph():
            if settings.PRODUCTHUNT_TOKEN:
                try:
                    headers = {"Authorization": f"Bearer {settings.PRODUCTHUNT_TOKEN}"}
                    query = """
                    query {
                      posts(first: 6, featured: true) {
                        edges {
                          node {
                            name
                            tagline
                            votesCount
                          }
                        }
                      }
                    }
                    """
                    async with httpx.AsyncClient(timeout=6.0) as client:
                        res = await client.post(
                            "https://api.producthunt.com/v2/api/graphql",
                            json={"query": query},
                            headers=headers
                        )
                        if res.status_code == 200:
                            edges = res.json().get("data", {}).get("posts", {}).get("edges", [])
                            for edge in edges:
                                node = edge.get("node", {})
                                ph_posts.append({
                                    "name": node.get("name", ""),
                                    "tagline": node.get("tagline", ""),
                                    "votes": node.get("votesCount", 0)
                                })
                except Exception as e:
                    logger.error(f"Market Scraper failed to fetch Product Hunt: {e}")

        await asyncio.gather(fetch_github(), fetch_news(), fetch_ph())

        # 2. Formulate Llama 3.3 Prompts to extract market signals
        system_prompt = """You are a elite AI Market Intelligence and Trend Sentiment Analyst.
Your task is to analyze raw streams of live GitHub repositories, tech news articles, and featured Product Hunt launches, and synthesize exactly 4 to 6 high-fidelity market signals (tool interest levels, velocities, and community sentiments).

Each signal object inside the resulting array MUST perfectly match this JSON schema:
[
  {
    "source_type": "github" | "news" | "producthunt" | "reddit",
    "source_name": "Name of the source channel, e.g. GitHub Trending, Product Hunt Launches, TechCrunch",
    "tool_name": "Name of the analyzed emerging AI tool/framework",
    "sentiment_score": -1.0 to 1.0 (float representing average positive or negative developer sentiment),
    "trend_velocity": 0.0 to 1.0 (float representing adoption/interest speed),
    "community_mentions": number of estimated discussions or mentions (integer),
    "github_growth": star stargazers count or growth rate index (float),
    "producthunt_rank": Product Hunt votes count (integer),
    "funding_activity": "Seed funding / Series A" or empty string
  }
]

Do not output any introductory or explanatory text. Return ONLY the raw JSON array of 4-6 items."""

        user_prompt = f"""Generate fresh market intelligence signals based on this live operational data:
- Startup Industry Context: {startup_type if startup_type else "AI Agent Operations"}

Raw live GitHub repositories:
{json.dumps(github_repos, indent=2) if github_repos else "No active GitHub repositories found."}

Raw live News feeds:
{json.dumps(news_articles, indent=2) if news_articles else "No active tech news found."}

Raw live Product Hunt releases:
{json.dumps(ph_posts, indent=2) if ph_posts else "No active Product Hunt launches found."}

Task: Synthesize and output exactly 4 to 6 clean, realistic, and highly accurate market signals."""

        signals_data = []
        try:
            raw_response = await ai_client.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                agent_name="trend_agent",
                response_format="json"
            )
            
            clean_res = raw_response.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            
            signals_data = json.loads(clean_res)
        except Exception as e:
            logger.error(f"Market Scraper AI reasoning failed: {e}")
            # Fallback to smart signals if API or Groq limits are encountered
            signals_data = [
                {
                    "source_type": "github",
                    "source_name": "GitHub Trending",
                    "tool_name": "FastAI Agent",
                    "sentiment_score": 0.88,
                    "trend_velocity": 0.92,
                    "community_mentions": 1240,
                    "github_growth": 45.2,
                    "producthunt_rank": 0,
                    "funding_activity": ""
                },
                {
                    "source_type": "producthunt",
                    "source_name": "Product Hunt Featured",
                    "tool_name": "SaaSForge",
                    "sentiment_score": 0.82,
                    "trend_velocity": 0.85,
                    "community_mentions": 780,
                    "github_growth": 0.0,
                    "producthunt_rank": 480,
                    "funding_activity": "Seed Round"
                }
            ]

        # 3. Create database records, insert new ones, and update existing ones
        inserted_records = []
        
        signals_list = []
        if isinstance(signals_data, list):
            signals_list = signals_data
        elif isinstance(signals_data, dict):
            # Check if there is a list inside any key
            found_list = False
            for k, v in signals_data.items():
                if isinstance(v, list):
                    signals_list = v
                    found_list = True
                    break
            if not found_list:
                signals_list = [signals_data]

        # Fetch existing signals for replace-in-place
        existing_signals = await self.sheets.market_intelligence.find_all()
        existing_by_tool = {}
        for r in existing_signals:
            tool_key = str(r.get("tool_name", "")).strip().lower()
            existing_by_tool[tool_key] = r

        updates = []  # List of tuples (intelligence_id, update_dict)
        to_insert = []

        for data in signals_list:
            if not isinstance(data, dict):
                continue
            
            tool_name = data.get("tool_name", "Emerging SaaS")
            name_clean = str(tool_name).strip().lower()
            
            if name_clean and name_clean not in existing_names:
                existing_names.add(name_clean)
                new_catalog_tool = AIToolInDB(
                    tool_name=tool_name,
                    category=data.get("source_type", "Ecosystem Tool").capitalize(),
                    pricing="Free tier available",
                    compatibility_tags=data.get("source_type", "emerging"),
                    api_support="REST",
                    description=f"Trending AI tool discovered via {data.get('source_name', 'live market scans')}.",
                    website="",
                    trust_score=safe_float(data.get("sentiment_score"), 0.8),
                    future_proof_score=safe_float(data.get("trend_velocity"), 0.8),
                    github_growth=safe_float(data.get("github_growth"), 0.0),
                    reddit_sentiment=safe_float(data.get("sentiment_score"), 0.8),
                    market_velocity=safe_float(data.get("trend_velocity"), 0.8),
                    security_score=0.85
                )
                new_catalog_tools.append(new_catalog_tool.model_dump())
            
            create_obj = MarketIntelligenceCreate(
                source_type=data.get("source_type", "news"),
                source_name=data.get("source_name", "News Feed"),
                tool_name=tool_name,
                sentiment_score=safe_float(data.get("sentiment_score"), 0.0),
                trend_velocity=safe_float(data.get("trend_velocity"), 0.0),
                community_mentions=safe_int(data.get("community_mentions"), 0),
                github_growth=safe_float(data.get("github_growth"), 0.0),
                producthunt_rank=safe_int(data.get("producthunt_rank"), 0),
                funding_activity=data.get("funding_activity", "")
            )
            
            if name_clean in existing_by_tool:
                existing_sig = existing_by_tool[name_clean]
                intelligence_id = existing_sig.get("intelligence_id")
                
                update_dict = {
                    "source_type": create_obj.source_type,
                    "source_name": create_obj.source_name,
                    "sentiment_score": create_obj.sentiment_score,
                    "trend_velocity": create_obj.trend_velocity,
                    "community_mentions": create_obj.community_mentions,
                    "github_growth": create_obj.github_growth,
                    "producthunt_rank": create_obj.producthunt_rank,
                    "funding_activity": create_obj.funding_activity,
                    "created_at": datetime.utcnow().isoformat()
                }
                updates.append((intelligence_id, update_dict))
                
                # Update local dictionary reference for the response payload
                existing_sig.update(update_dict)
                inserted_records.append(existing_sig)
            else:
                in_db = MarketIntelligenceInDB(**create_obj.model_dump())
                dumped = in_db.model_dump()
                to_insert.append(dumped)
                inserted_records.append(dumped)

        # Bulk insert new tools to catalog
        if new_catalog_tools:
            await self.sheets.ai_tools.insert_many(new_catalog_tools)
            logger.info(f"[CATALOG] Inserted {len(new_catalog_tools)} newly crawled tools into AI_TOOLS_MASTER Sheet!")

        # Execute updates in database
        for intelligence_id, update_dict in updates:
            await self.sheets.market_intelligence.update(intelligence_id, update_dict)

        # Execute inserts in database
        if to_insert:
            await self.sheets.market_intelligence.insert_many(to_insert)

        # Physically re-read all market intelligence records from Excel sheet (database) to ensure absolute consistency
        fetched_signals = await self.sheets.market_intelligence.find_all(
            sort_by="created_at", sort_desc=True, limit=20
        )
        logger.info(f"Crawl complete: {len(updates)} replaced, {len(to_insert)} newly created market signals. Physical re-read fetched {len(fetched_signals)} records.")
        return [self._to_response(r) for r in fetched_signals]
