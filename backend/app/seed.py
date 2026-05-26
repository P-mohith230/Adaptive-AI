"""
AdaptiveAI — Data Seeding Script
====================================
Pre-populates the AI Tools catalog and Market Intelligence with realistic data.
Runs automatically on first startup when sheets are empty.
"""

import json
from datetime import datetime, timedelta
import random

from app.storage.sheet_manager import get_sheet_manager
from app.core.logging import get_logger

logger = get_logger("seed")

# ── 50+ Real AI Tools ────────────────────────────────────

AI_TOOLS_SEED = [
    # Development
    {"tool_name": "Cursor", "category": "Development", "pricing": "$20/mo", "trust_score": 0.94, "future_proof_score": 0.92, "github_growth": 85.0, "reddit_sentiment": 0.91, "market_velocity": 0.95, "compatibility_tags": "IDE,coding,AI-native,development", "api_support": "SDK", "security_score": 0.88, "description": "AI-native code editor built for pair programming with AI", "website": "https://cursor.sh"},
    {"tool_name": "GitHub Copilot", "category": "Development", "pricing": "$19/mo", "trust_score": 0.91, "future_proof_score": 0.90, "github_growth": 72.0, "reddit_sentiment": 0.82, "market_velocity": 0.85, "compatibility_tags": "IDE,coding,autocomplete,development", "api_support": "SDK", "security_score": 0.90, "description": "AI pair programmer that helps you write code faster", "website": "https://github.com/features/copilot"},
    {"tool_name": "Replit", "category": "Development", "pricing": "Freemium", "trust_score": 0.82, "future_proof_score": 0.80, "github_growth": 45.0, "reddit_sentiment": 0.72, "market_velocity": 0.78, "compatibility_tags": "IDE,cloud,collaboration,development", "api_support": "REST", "security_score": 0.75, "description": "Browser-based IDE with AI coding assistance", "website": "https://replit.com"},
    {"tool_name": "v0.dev", "category": "Development", "pricing": "Freemium", "trust_score": 0.88, "future_proof_score": 0.91, "github_growth": 95.0, "reddit_sentiment": 0.89, "market_velocity": 0.93, "compatibility_tags": "UI,frontend,React,development", "api_support": "REST", "security_score": 0.85, "description": "AI-powered UI component generator by Vercel", "website": "https://v0.dev"},
    {"tool_name": "Bolt.new", "category": "Development", "pricing": "Freemium", "trust_score": 0.85, "future_proof_score": 0.88, "github_growth": 88.0, "reddit_sentiment": 0.86, "market_velocity": 0.90, "compatibility_tags": "fullstack,prototyping,development", "api_support": "REST", "security_score": 0.80, "description": "AI full-stack app builder in the browser", "website": "https://bolt.new"},
    {"tool_name": "Devin", "category": "Development", "pricing": "$500/mo", "trust_score": 0.72, "future_proof_score": 0.85, "github_growth": 60.0, "reddit_sentiment": 0.55, "market_velocity": 0.82, "compatibility_tags": "AI-agent,autonomous,development", "api_support": "REST", "security_score": 0.78, "description": "First autonomous AI software engineer", "website": "https://devin.ai"},
    {"tool_name": "Linear", "category": "Project Management", "pricing": "$8/user/mo", "trust_score": 0.92, "future_proof_score": 0.88, "github_growth": 35.0, "reddit_sentiment": 0.90, "market_velocity": 0.72, "compatibility_tags": "project-management,engineering,agile", "api_support": "GraphQL", "security_score": 0.92, "description": "Streamlined project management for engineering teams", "website": "https://linear.app"},

    # Design & Creative
    {"tool_name": "Midjourney", "category": "Design", "pricing": "$10/mo", "trust_score": 0.88, "future_proof_score": 0.82, "github_growth": 0.0, "reddit_sentiment": 0.78, "market_velocity": 0.70, "compatibility_tags": "image-generation,creative,design", "api_support": "None", "security_score": 0.72, "description": "AI image generation through Discord", "website": "https://midjourney.com"},
    {"tool_name": "Figma AI", "category": "Design", "pricing": "$15/user/mo", "trust_score": 0.90, "future_proof_score": 0.88, "github_growth": 25.0, "reddit_sentiment": 0.85, "market_velocity": 0.80, "compatibility_tags": "design,UI/UX,prototyping,collaboration", "api_support": "REST", "security_score": 0.90, "description": "Collaborative design tool with AI features", "website": "https://figma.com"},
    {"tool_name": "DALL-E 3", "category": "Design", "pricing": "Pay-per-use", "trust_score": 0.85, "future_proof_score": 0.80, "github_growth": 42.0, "reddit_sentiment": 0.75, "market_velocity": 0.72, "compatibility_tags": "image-generation,creative,API", "api_support": "REST", "security_score": 0.88, "description": "OpenAI's advanced image generation model", "website": "https://openai.com/dall-e-3"},
    {"tool_name": "Runway ML", "category": "Design", "pricing": "$15/mo", "trust_score": 0.84, "future_proof_score": 0.85, "github_growth": 38.0, "reddit_sentiment": 0.80, "market_velocity": 0.82, "compatibility_tags": "video,creative,editing,design", "api_support": "REST", "security_score": 0.78, "description": "AI-powered creative tools for video and image generation", "website": "https://runwayml.com"},

    # Communication & Knowledge
    {"tool_name": "Notion AI", "category": "Knowledge Management", "pricing": "$10/user/mo", "trust_score": 0.89, "future_proof_score": 0.86, "github_growth": 18.0, "reddit_sentiment": 0.82, "market_velocity": 0.75, "compatibility_tags": "documentation,wiki,knowledge-base,writing", "api_support": "REST", "security_score": 0.88, "description": "AI-powered workspace for docs, wikis, and projects", "website": "https://notion.so"},
    {"tool_name": "Slack AI", "category": "Communication", "pricing": "$8.75/user/mo", "trust_score": 0.87, "future_proof_score": 0.82, "github_growth": 12.0, "reddit_sentiment": 0.78, "market_velocity": 0.68, "compatibility_tags": "messaging,communication,team,integration", "api_support": "REST", "security_score": 0.92, "description": "AI-enhanced team communication platform", "website": "https://slack.com"},
    {"tool_name": "Otter.ai", "category": "Communication", "pricing": "$16.99/mo", "trust_score": 0.82, "future_proof_score": 0.78, "github_growth": 8.0, "reddit_sentiment": 0.75, "market_velocity": 0.65, "compatibility_tags": "transcription,meetings,notes", "api_support": "REST", "security_score": 0.80, "description": "AI meeting transcription and note-taking", "website": "https://otter.ai"},
    {"tool_name": "Grammarly", "category": "Writing", "pricing": "Freemium", "trust_score": 0.88, "future_proof_score": 0.75, "github_growth": 5.0, "reddit_sentiment": 0.80, "market_velocity": 0.60, "compatibility_tags": "writing,grammar,communication", "api_support": "SDK", "security_score": 0.85, "description": "AI writing assistant for grammar and style", "website": "https://grammarly.com"},

    # AI Models & APIs
    {"tool_name": "OpenAI GPT-4o", "category": "AI Models", "pricing": "Pay-per-use", "trust_score": 0.95, "future_proof_score": 0.88, "github_growth": 90.0, "reddit_sentiment": 0.85, "market_velocity": 0.88, "compatibility_tags": "LLM,API,chat,reasoning", "api_support": "REST", "security_score": 0.90, "description": "Advanced multimodal AI model by OpenAI", "website": "https://openai.com"},
    {"tool_name": "Claude", "category": "AI Models", "pricing": "Pay-per-use", "trust_score": 0.93, "future_proof_score": 0.90, "github_growth": 75.0, "reddit_sentiment": 0.90, "market_velocity": 0.90, "compatibility_tags": "LLM,API,chat,reasoning,coding", "api_support": "REST", "security_score": 0.92, "description": "Anthropic's AI assistant focused on safety and helpfulness", "website": "https://anthropic.com"},
    {"tool_name": "Gemini", "category": "AI Models", "pricing": "Pay-per-use", "trust_score": 0.88, "future_proof_score": 0.92, "github_growth": 65.0, "reddit_sentiment": 0.75, "market_velocity": 0.85, "compatibility_tags": "LLM,API,multimodal,Google", "api_support": "REST", "security_score": 0.92, "description": "Google DeepMind's multimodal AI model", "website": "https://deepmind.google"},
    {"tool_name": "Perplexity", "category": "AI Search", "pricing": "$20/mo", "trust_score": 0.87, "future_proof_score": 0.85, "github_growth": 55.0, "reddit_sentiment": 0.88, "market_velocity": 0.88, "compatibility_tags": "search,research,knowledge", "api_support": "REST", "security_score": 0.82, "description": "AI-powered answer engine with real-time search", "website": "https://perplexity.ai"},

    # Marketing
    {"tool_name": "Jasper", "category": "Marketing", "pricing": "$49/mo", "trust_score": 0.80, "future_proof_score": 0.72, "github_growth": 10.0, "reddit_sentiment": 0.68, "market_velocity": 0.60, "compatibility_tags": "content,copywriting,marketing", "api_support": "REST", "security_score": 0.78, "description": "AI content creation for marketing teams", "website": "https://jasper.ai"},
    {"tool_name": "Copy.ai", "category": "Marketing", "pricing": "$36/mo", "trust_score": 0.78, "future_proof_score": 0.70, "github_growth": 8.0, "reddit_sentiment": 0.65, "market_velocity": 0.58, "compatibility_tags": "content,copywriting,marketing", "api_support": "REST", "security_score": 0.75, "description": "AI-powered copywriting and content generation", "website": "https://copy.ai"},
    {"tool_name": "HubSpot AI", "category": "Marketing", "pricing": "$50/mo", "trust_score": 0.88, "future_proof_score": 0.82, "github_growth": 15.0, "reddit_sentiment": 0.80, "market_velocity": 0.72, "compatibility_tags": "CRM,marketing,sales,automation", "api_support": "REST", "security_score": 0.90, "description": "AI-enhanced CRM and marketing automation", "website": "https://hubspot.com"},
    {"tool_name": "Surfer SEO", "category": "Marketing", "pricing": "$89/mo", "trust_score": 0.82, "future_proof_score": 0.75, "github_growth": 5.0, "reddit_sentiment": 0.78, "market_velocity": 0.65, "compatibility_tags": "SEO,content,optimization,marketing", "api_support": "REST", "security_score": 0.80, "description": "AI-powered SEO content optimization", "website": "https://surferseo.com"},

    # Automation & Operations
    {"tool_name": "Zapier", "category": "Automation", "pricing": "$29.99/mo", "trust_score": 0.91, "future_proof_score": 0.80, "github_growth": 20.0, "reddit_sentiment": 0.82, "market_velocity": 0.72, "compatibility_tags": "automation,integration,no-code,operations", "api_support": "REST", "security_score": 0.88, "description": "No-code automation connecting 5000+ apps", "website": "https://zapier.com"},
    {"tool_name": "Make", "category": "Automation", "pricing": "$9/mo", "trust_score": 0.86, "future_proof_score": 0.78, "github_growth": 15.0, "reddit_sentiment": 0.80, "market_velocity": 0.70, "compatibility_tags": "automation,integration,visual,operations", "api_support": "REST", "security_score": 0.82, "description": "Visual workflow automation platform", "website": "https://make.com"},
    {"tool_name": "n8n", "category": "Automation", "pricing": "Free/Self-hosted", "trust_score": 0.85, "future_proof_score": 0.82, "github_growth": 55.0, "reddit_sentiment": 0.85, "market_velocity": 0.78, "compatibility_tags": "automation,open-source,self-hosted,operations", "api_support": "REST", "security_score": 0.80, "description": "Open-source workflow automation with fair-code license", "website": "https://n8n.io"},

    # Analytics & Data
    {"tool_name": "Tableau", "category": "Analytics", "pricing": "$75/user/mo", "trust_score": 0.90, "future_proof_score": 0.78, "github_growth": 10.0, "reddit_sentiment": 0.75, "market_velocity": 0.62, "compatibility_tags": "analytics,visualization,BI,data", "api_support": "REST", "security_score": 0.92, "description": "Interactive data visualization and business intelligence", "website": "https://tableau.com"},
    {"tool_name": "Mixpanel", "category": "Analytics", "pricing": "Freemium", "trust_score": 0.86, "future_proof_score": 0.80, "github_growth": 12.0, "reddit_sentiment": 0.78, "market_velocity": 0.68, "compatibility_tags": "analytics,product,events,data", "api_support": "REST", "security_score": 0.88, "description": "Product analytics for data-driven decisions", "website": "https://mixpanel.com"},

    # Customer Support
    {"tool_name": "Intercom", "category": "Customer Support", "pricing": "$74/mo", "trust_score": 0.88, "future_proof_score": 0.82, "github_growth": 15.0, "reddit_sentiment": 0.78, "market_velocity": 0.72, "compatibility_tags": "support,chat,helpdesk,customer", "api_support": "REST", "security_score": 0.88, "description": "AI-first customer service platform", "website": "https://intercom.com"},
    {"tool_name": "Zendesk AI", "category": "Customer Support", "pricing": "$55/agent/mo", "trust_score": 0.85, "future_proof_score": 0.75, "github_growth": 8.0, "reddit_sentiment": 0.70, "market_velocity": 0.62, "compatibility_tags": "support,ticketing,helpdesk,customer", "api_support": "REST", "security_score": 0.90, "description": "AI-powered customer service and support ticketing", "website": "https://zendesk.com"},

    # Security
    {"tool_name": "Snyk", "category": "Security", "pricing": "Freemium", "trust_score": 0.90, "future_proof_score": 0.85, "github_growth": 30.0, "reddit_sentiment": 0.82, "market_velocity": 0.75, "compatibility_tags": "security,DevSecOps,vulnerability,development", "api_support": "REST", "security_score": 0.95, "description": "Developer-first security for code and dependencies", "website": "https://snyk.io"},

    # Data & Infrastructure
    {"tool_name": "Airbyte", "category": "Data Infrastructure", "pricing": "Free/Cloud", "trust_score": 0.84, "future_proof_score": 0.82, "github_growth": 48.0, "reddit_sentiment": 0.80, "market_velocity": 0.78, "compatibility_tags": "ETL,data-pipeline,integration,infrastructure", "api_support": "REST", "security_score": 0.80, "description": "Open-source data integration platform", "website": "https://airbyte.com"},
    {"tool_name": "Pinecone", "category": "Data Infrastructure", "pricing": "Freemium", "trust_score": 0.86, "future_proof_score": 0.88, "github_growth": 40.0, "reddit_sentiment": 0.82, "market_velocity": 0.85, "compatibility_tags": "vector-database,embeddings,AI,infrastructure", "api_support": "REST", "security_score": 0.85, "description": "Managed vector database for AI applications", "website": "https://pinecone.io"},
    {"tool_name": "LangChain", "category": "AI Framework", "pricing": "Free/Open-source", "trust_score": 0.82, "future_proof_score": 0.85, "github_growth": 72.0, "reddit_sentiment": 0.70, "market_velocity": 0.82, "compatibility_tags": "framework,LLM,agents,development", "api_support": "SDK", "security_score": 0.75, "description": "Framework for building LLM-powered applications", "website": "https://langchain.com"},
    {"tool_name": "Vercel", "category": "Infrastructure", "pricing": "Freemium", "trust_score": 0.92, "future_proof_score": 0.88, "github_growth": 55.0, "reddit_sentiment": 0.88, "market_velocity": 0.82, "compatibility_tags": "hosting,deployment,frontend,infrastructure", "api_support": "REST", "security_score": 0.90, "description": "Frontend cloud platform for deploying web applications", "website": "https://vercel.com"},
    {"tool_name": "Supabase", "category": "Infrastructure", "pricing": "Freemium", "trust_score": 0.88, "future_proof_score": 0.86, "github_growth": 62.0, "reddit_sentiment": 0.85, "market_velocity": 0.82, "compatibility_tags": "database,auth,backend,infrastructure", "api_support": "REST", "security_score": 0.85, "description": "Open-source Firebase alternative with PostgreSQL", "website": "https://supabase.com"},
]

# ── Market Intelligence Seeds ────────────────────────────

MARKET_INTEL_SEED = [
    {"source_type": "reddit", "source_name": "r/artificial", "tool_name": "Cursor", "sentiment_score": 0.92, "trend_velocity": 0.95, "community_mentions": 4280, "github_growth": 85.0, "producthunt_rank": 2, "funding_activity": "Series B - $400M"},
    {"source_type": "github", "source_name": "trending", "tool_name": "v0.dev", "sentiment_score": 0.88, "trend_velocity": 0.91, "community_mentions": 2150, "github_growth": 95.0, "producthunt_rank": 1, "funding_activity": "Vercel backed"},
    {"source_type": "producthunt", "source_name": "daily_top", "tool_name": "Bolt.new", "sentiment_score": 0.85, "trend_velocity": 0.89, "community_mentions": 1800, "github_growth": 88.0, "producthunt_rank": 3, "funding_activity": "Seed - $15M"},
    {"source_type": "reddit", "source_name": "r/MachineLearning", "tool_name": "Claude", "sentiment_score": 0.90, "trend_velocity": 0.88, "community_mentions": 6500, "github_growth": 75.0, "producthunt_rank": 5, "funding_activity": "Series D - $2B"},
    {"source_type": "news", "source_name": "TechCrunch", "tool_name": "Perplexity", "sentiment_score": 0.88, "trend_velocity": 0.86, "community_mentions": 3200, "github_growth": 55.0, "producthunt_rank": 4, "funding_activity": "Series B - $500M"},
    {"source_type": "reddit", "source_name": "r/webdev", "tool_name": "Notion AI", "sentiment_score": 0.78, "trend_velocity": 0.72, "community_mentions": 2800, "github_growth": 18.0, "producthunt_rank": 8, "funding_activity": "Series C - $275M"},
    {"source_type": "github", "source_name": "stars_growth", "tool_name": "n8n", "sentiment_score": 0.85, "trend_velocity": 0.78, "community_mentions": 1500, "github_growth": 55.0, "producthunt_rank": 12, "funding_activity": "Series B - $12M"},
    {"source_type": "producthunt", "source_name": "weekly_top", "tool_name": "Linear", "sentiment_score": 0.90, "trend_velocity": 0.72, "community_mentions": 1200, "github_growth": 35.0, "producthunt_rank": 6, "funding_activity": "Series B - $35M"},
    {"source_type": "hackernews", "source_name": "front_page", "tool_name": "LangChain", "sentiment_score": 0.68, "trend_velocity": 0.82, "community_mentions": 3800, "github_growth": 72.0, "producthunt_rank": 15, "funding_activity": "Series A - $25M"},
    {"source_type": "reddit", "source_name": "r/SaaS", "tool_name": "Supabase", "sentiment_score": 0.85, "trend_velocity": 0.82, "community_mentions": 2100, "github_growth": 62.0, "producthunt_rank": 7, "funding_activity": "Series C - $80M"},
    {"source_type": "news", "source_name": "TheVerge", "tool_name": "Midjourney", "sentiment_score": 0.75, "trend_velocity": 0.68, "community_mentions": 8500, "github_growth": 0.0, "producthunt_rank": 10, "funding_activity": "Self-funded"},
    {"source_type": "reddit", "source_name": "r/devops", "tool_name": "Snyk", "sentiment_score": 0.82, "trend_velocity": 0.75, "community_mentions": 900, "github_growth": 30.0, "producthunt_rank": 20, "funding_activity": "Series G - $196M"},
]

# ── Alert Seeds ──────────────────────────────────────────

ALERT_SEED = [
    {"alert_type": "obsolescence", "alert_message": "Your legacy reporting tools show declining community support. Consider migrating to Tableau AI or Mixpanel.", "replacement_tool": "Tableau AI", "severity": "high", "market_change_trigger": "Community sentiment dropped 40% in 90 days"},
    {"alert_type": "emerging", "alert_message": "Cursor is gaining rapid adoption in your industry vertical. Consider evaluating for development workflow.", "replacement_tool": "Cursor", "severity": "medium", "market_change_trigger": "Market velocity increased to 0.95"},
    {"alert_type": "replacement", "alert_message": "v0.dev can significantly accelerate your frontend development. 92% match with your tech stack.", "replacement_tool": "v0.dev", "severity": "medium", "market_change_trigger": "New tool with 92% compatibility detected"},
    {"alert_type": "security", "alert_message": "One of your current tools has reported API security vulnerabilities. Review your integration.", "replacement_tool": "Snyk", "severity": "critical", "market_change_trigger": "Security advisory published"},
    {"alert_type": "pricing", "alert_message": "Jasper announced a 35% price increase effective next quarter. Consider Copy.ai as alternative.", "replacement_tool": "Copy.ai", "severity": "low", "market_change_trigger": "Pricing change announcement"},
]


async def seed_data_if_empty():
    """Seed master sheets with initial data if they're empty."""
    import uuid
    sheets = get_sheet_manager()

    # Seed AI Tools
    tool_count = await sheets.ai_tools.count()
    if tool_count == 0:
        logger.info("Seeding AI_TOOLS_MASTER with catalog data in bulk...")
        tools_to_insert = []
        for tool in AI_TOOLS_SEED:
            tool_copy = tool.copy()
            tool_copy["tool_id"] = f"tool_{uuid.uuid4().hex[:12]}"
            tool_copy["created_at"] = datetime.utcnow().isoformat()
            tools_to_insert.append(tool_copy)
        await sheets.ai_tools.insert_many(tools_to_insert)
        logger.info(f"Seeded {len(AI_TOOLS_SEED)} AI tools")

    # Seed Market Intelligence
    intel_count = await sheets.market_intelligence.count()
    if intel_count == 0:
        logger.info("Seeding MARKET_INTELLIGENCE_MASTER with market data in bulk...")
        intel_to_insert = []
        for intel in MARKET_INTEL_SEED:
            intel_copy = intel.copy()
            intel_copy["intelligence_id"] = f"int_{uuid.uuid4().hex[:12]}"
            intel_copy["created_at"] = datetime.utcnow().isoformat()
            intel_to_insert.append(intel_copy)
        await sheets.market_intelligence.insert_many(intel_to_insert)
        logger.info(f"Seeded {len(MARKET_INTEL_SEED)} market signals")

    logger.info("Data seeding complete")
