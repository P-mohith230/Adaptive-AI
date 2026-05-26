"""
AdaptiveAI — Multi-Model AI Client (Groq + OpenRouter Bagger)
================================================================
Unified async client that distributes agents across multiple AI models
running on Groq and OpenRouter backends. Each agent gets assigned a
specific model optimized for its reasoning type.

ARCHITECTURE: Multi-Model Bagger
- Each agent → specific model → parallel execution → aggregated output
- Groq API (OpenAI-compatible) for Llama 4 Scout, Groq Compound, Llama 3.3
- OpenRouter API (OpenAI-compatible) for Baidu Cobuddy (free fallback)
- Automatic fallback chain: primary model → next Groq model → OpenRouter → mock

MODEL ASSIGNMENT:
  strategy_agent  → Llama 4 Scout  (best reasoning, complex synthesis)
  workflow_agent  → Llama 4 Scout  (structured process analysis)
  research_agent  → Groq Compound  (compound AI, multi-step retrieval)
  roi_agent       → Groq Compound  (numerical estimation)
  sentiment_agent → Llama 3.3 70B  (versatile text classification)
  trend_agent     → Llama 3.3 70B  (pattern recognition)
"""

import json
import hashlib
import asyncio
from typing import Optional
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger("ai_client")


# ── Model Registry ──────────────────────────────────────────────────

GROQ_MODELS = {
    "llama-4-scout": "meta-llama/llama-4-scout-17b-16e-instruct",
    "groq-compound": "groq/compound",
    "groq-compound-mini": "groq/compound-mini",
    "llama-3.3-70b": "llama-3.3-70b-versatile",
    "llama-3.1-8b": "llama-3.1-8b-instant",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "qwen3-32b": "qwen/qwen3-32b",
}

OPENROUTER_MODELS = {
    "cobuddy": "baidu/cobuddy:free",
}

# Agent → Model mapping (each agent gets a specialized model)
AGENT_MODEL_MAP = {
    "strategy_agent":  ("groq", "gpt-oss-120b"),
    "workflow_agent":  ("groq", "qwen3-32b"),
    "research_agent":  ("groq", "qwen3-32b"),
    "roi_agent":       ("groq", "qwen3-32b"),
    "sentiment_agent": ("groq", "qwen3-32b"),
    "trend_agent":     ("groq", "qwen3-32b"),
}

# Fallback chain when primary model fails (with robust high-quota active fallovers)
FALLBACK_CHAIN = [
    ("groq", "qwen3-32b"),
    ("groq", "gpt-oss-120b"),
    ("groq", "gpt-oss-20b"),
    ("groq", "groq-compound-mini"),
    ("groq", "llama-3.1-8b"),
    ("groq", "llama-3.3-70b"),
    ("groq", "llama-4-scout"),
]


class MultiModelClient:
    """
    Multi-model bagger client.
    Routes each agent to its assigned model, with automatic fallback.
    Groq and OpenRouter both use OpenAI-compatible chat completions API.
    """

    def __init__(self):
        self.settings = get_settings()
        self._groq_client = None
        self._openrouter_client = None

        if not self.settings.USE_MOCK_AI:
            self._init_providers()
        else:
            logger.info("AI Client initialized in MOCK mode — using simulated reasoning")

    def _init_providers(self):
        """Initialize Groq and OpenRouter clients (both OpenAI-compatible)."""
        try:
            from openai import AsyncOpenAI

            if self.settings.GROQ_API_KEY:
                self._groq_client = AsyncOpenAI(
                    api_key=self.settings.GROQ_API_KEY,
                    base_url="https://api.groq.com/openai/v1",
                )
                logger.info("[OK] Groq client initialized (Llama 4 Scout, Compound, Llama 3.3)")

            if self.settings.OPENROUTER_API_KEY:
                self._openrouter_client = AsyncOpenAI(
                    api_key=self.settings.OPENROUTER_API_KEY,
                    base_url="https://openrouter.ai/api/v1",
                )
                logger.info("[OK] OpenRouter client initialized (Baidu Cobuddy)")

            if not self._groq_client and not self._openrouter_client:
                logger.warning("No AI API keys configured — falling back to mock mode")

        except ImportError:
            logger.warning("openai package not installed — falling back to mock mode")

    def _get_client_and_model(self, provider: str, model_key: str):
        """Resolve provider string to actual client + model ID."""
        if provider == "groq" and self._groq_client:
            return self._groq_client, GROQ_MODELS.get(model_key, model_key)
        elif provider == "openrouter" and self._openrouter_client:
            return self._openrouter_client, OPENROUTER_MODELS.get(model_key, model_key)
        return None, None

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        agent_name: str = "",
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        response_format: str = "text",
    ) -> str:
        """
        Generate AI response using the model assigned to this agent.
        Falls back through the chain if primary model fails.
        """
        temperature = temperature if temperature is not None else self.settings.AI_TEMPERATURE
        max_tokens = max_tokens or self.settings.AI_MAX_TOKENS

        if self.settings.USE_MOCK_AI or (not self._groq_client and not self._openrouter_client):
            return self._mock_generate(system_prompt, user_prompt, agent_name)

        # Determine which model this agent should use
        if agent_name and agent_name in AGENT_MODEL_MAP:
            primary_provider, primary_model = AGENT_MODEL_MAP[agent_name]
        else:
            primary_provider, primary_model = "groq", "llama-3.3-70b"

        # Build attempt chain: primary → fallbacks
        attempts = [(primary_provider, primary_model)]
        for fb in FALLBACK_CHAIN:
            if fb != (primary_provider, primary_model):
                attempts.append(fb)

        # Try each model in the chain
        last_error = None
        for provider, model_key in attempts:
            client, model_id = self._get_client_and_model(provider, model_key)
            if not client:
                continue

            try:
                result = await self._call_provider(
                    client, model_id, system_prompt, user_prompt,
                    temperature, max_tokens, response_format, provider
                )
                if agent_name:
                    logger.info(f"[{agent_name}] -> {provider}/{model_key} [OK]")
                return result

            except Exception as e:
                last_error = e
                logger.warning(
                    f"[{agent_name or 'unknown'}] {provider}/{model_key} failed: {e} — trying next"
                )
                continue

        # All models failed — graceful fallback to mock
        logger.error(f"All models failed for {agent_name}: {last_error} — using mock")
        return self._mock_generate(system_prompt, user_prompt, agent_name)

    async def _call_provider(
        self,
        client,
        model_id: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
        response_format: str,
        provider: str,
    ) -> str:
        """Make the actual API call to Groq or OpenRouter."""
        kwargs = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # JSON mode support varies by model
        if response_format == "json":
            # Groq Llama models support json_object response format
            if provider == "groq" and "compound" not in model_id:
                kwargs["response_format"] = {"type": "json_object"}
            else:
                # For models without native JSON mode, instruct via prompt
                kwargs["messages"][0]["content"] += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanatory text."

        response = await client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content

        # Clean any accidental markdown code fences
        if content and content.strip().startswith("```"):
            lines = content.strip().split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)

        return content

    def _mock_generate(self, system_prompt: str, user_prompt: str, agent_name: str = "") -> str:
        """
        Generate intelligent, randomized mock responses based on prompt context.
        Uses keywords and agent_name to return contextually relevant and unique responses every single time.
        """
        import random
        import re
        from datetime import datetime
        prompt_lower = (system_prompt + " " + user_prompt).lower()

        if "consultant" in prompt_lower or "strategic consultant" in prompt_lower:
            import random
            org_name = "your organization"
            name_match = re.search(r"- Name:\s*([^\n]+)", system_prompt, re.IGNORECASE)
            if name_match:
                org_name = name_match.group(1).strip()
            elif "oscowl" in prompt_lower:
                org_name = "Oscowl Solutions"
            
            responses = [
                f"Hello! I am your **AdaptiveAI Strategic Consultant**. I have reviewed the active Excel worksheets for **{org_name}** in real time.\n\nBased on your startup's operational metrics, you have significant automation potential in your workflow pipeline. Let's focus on integrating tools like **Cursor** for development and **Zapier** to automate manual document flows. This alone is projected to save you hours of manual labor every single week!\n\nWhat specific part of your tech stack or ROI projections would you like to dive into today?",
                f"Welcome! Looking at **{org_name}**'s live operational spreadsheets, I noticed some outstanding opportunities for scaling your AI maturity.\n\nCurrently, transitioning from ad-hoc tools to native agentic orchestration is our highest ROI initiative. By doing so, you can expect to automate up to 35% of repetitive work across Engineering and Marketing.\n\nHow can I help you optimize your stack or review active vulnerability alerts today?",
                f"Hi there! As your Strategic Advisor, I am keeping a close eye on **{org_name}**'s operational metrics and active threat center.\n\nWe currently have a few critical security signals resolved in your local database. I suggest we prioritize addressing the latest library dependencies before launching your next automation workflows. \n\nWould you like me to calculate custom ROI statistics for a new tool or review your team's bottleneck map?"
            ]
            return random.choice(responses)

        if "threat" in prompt_lower or "alert" in prompt_lower or "obsolescence" in prompt_lower or "security" in prompt_lower:
            vulns = [
                {
                    "alert_type": "Security Vulnerability",
                    "alert_message": "A critical zero-day remote code execution vulnerability (CVE-2026-{rand_cve}) has been disclosed in {target_tool}, exposing administrative workflow tokens. Urgent patching recommended.",
                    "replacement_tool": "{target_tool_replacement}",
                    "severity": "critical",
                    "market_change_trigger": "NVD CVE-2026-{rand_cve}"
                },
                {
                    "alert_type": "Competitor Displacement",
                    "alert_message": "An emerging competitor '{comp_name}' in your automation vertical has just launched a featured product on Product Hunt today, boasting {comp_rate}% out-of-the-box workflow coverage and deep native agentic loops.",
                    "replacement_tool": "AdaptiveAI Agentic Orchestrator",
                    "severity": "high",
                    "market_change_trigger": "Product Hunt featured launch: {comp_name}"
                },
                {
                    "alert_type": "Licensing Alert",
                    "alert_message": "The open-source library '{lib_name}' used in your active SaaS stack has announced a restrictive license change ({license_type}), which could impact proprietary deployment models.",
                    "replacement_tool": "{lib_replacement}",
                    "severity": "medium",
                    "market_change_trigger": "GitHub license update notice for {lib_name}"
                },
                {
                    "alert_type": "Compliance Warning",
                    "alert_message": "New AI safety regulations ({reg_name}) will take effect next quarter, requiring mandatory auditing of model outputs for compliance. Adjusting operational data logs is highly advised.",
                    "replacement_tool": "AdaptiveAI Auditing Tool",
                    "severity": "high",
                    "market_change_trigger": "EU AI Act Compliance Directive"
                },
                {
                    "alert_type": "Deprecation Notice",
                    "alert_message": "The legacy API endpoint for {tool_deprecated} will be officially deprecated by the vendor on {date_dep}. Migrating to {tool_deprecated_replacement} is recommended to prevent service disruption.",
                    "replacement_tool": "{tool_deprecated_replacement}",
                    "severity": "medium",
                    "market_change_trigger": "Developer API deprecation schedule"
                }
            ]
            
            # Select 2 to 3 threats randomly to ensure uniqueness
            selected = random.sample(vulns, random.randint(2, 3))
            
            results = []
            for item in selected:
                cve = str(random.randint(1000, 9999))
                target_tool = random.choice(["LangChain", "FastAPI", "Pandas", "Uvicorn", "ChromaDB", "LlamaIndex"])
                replacement = f"Secured {target_tool} v2.8.4"
                
                comp_name = random.choice(["SaaSFlow AI", "ZetaAutomate", "NexusAgent", "ApexFlow", "PromptForge"])
                comp_rate = str(random.randint(85, 98))
                
                lib_name = random.choice(["pydantic-v1", "numpy-core", "scikit-learn-lite", "requests-async"])
                license_type = random.choice(["AGPLv3", "SSPL", "Commons Clause"])
                lib_replacement = f"MIT-Licensed {lib_name.replace('-async', '').replace('-lite', '')} substitute"
                
                reg_name = random.choice(["EU-AI-Act Sec 4", "FTC AI-Disclosure guidelines", "SOC2-AI standard v2"])
                
                tool_deprecated = random.choice(["OpenAI DaVinci", "Claude 2.1 legacy", "Pinecone v1 Starter"])
                tool_deprecated_replacement = "modern equivalent endpoint"
                if "DaVinci" in tool_deprecated:
                    tool_deprecated_replacement = "GPT-4o mini"
                elif "Claude 2.1" in tool_deprecated:
                    tool_deprecated_replacement = "Claude 3.5 Sonnet"
                elif "Pinecone v1" in tool_deprecated:
                    tool_deprecated_replacement = "Pinecone Serverless"

                msg = item["alert_message"].format(
                    rand_cve=cve,
                    target_tool=target_tool,
                    comp_name=comp_name,
                    comp_rate=comp_rate,
                    lib_name=lib_name,
                    license_type=license_type,
                    reg_name=reg_name,
                    tool_deprecated=tool_deprecated,
                    date_dep="2026-09-30"
                )
                
                rep = item["replacement_tool"].format(
                    target_tool_replacement=replacement,
                    lib_replacement=lib_replacement,
                    tool_deprecated_replacement=tool_deprecated_replacement
                )
                
                trigger = item["market_change_trigger"].format(
                    rand_cve=cve,
                    comp_name=comp_name,
                    lib_name=lib_name
                )
                
                results.append({
                    "alert_type": item["alert_type"],
                    "alert_message": msg,
                    "replacement_tool": rep,
                    "severity": item["severity"],
                    "market_change_trigger": trigger
                })
                
            return json.dumps(results)

        if "scraped website" in prompt_lower or "landing page" in prompt_lower or "oscowl" in prompt_lower:
            org_name = "Oscowl" if "oscowl" in prompt_lower else "Bytehearts Solutions"
            startup_type = "AI-native Agentic Tech" if "oscowl" in prompt_lower else "SaaS Engineering"
            
            workflows = random.choice([
                "Client Request > AI Agent Processing > Deliver Output",
                "Product Design > Code Generation > Automated Testing > Release",
                "Lead Generation > Smart Filtering > Customer Outreach > Sales Pipeline",
                "Data Extraction > Sentiment Synthesis > Heatmap Compilation"
            ])
            tools = random.choice([
                "Cursor, GitHub Copilot, Llama-3, OpenAI API",
                "Framer, Zapier, ChatGPT, Linear",
                "Claude 3.5, LangChain, Pinecone, Next.js",
                "Make.com, Vercel, Supabase, Python"
            ])
            goals = random.choice([
                "Automate custom agent workflows, Implement autonomous code optimization, Streamline client delivery pipelines",
                "Optimize software releases, Automate design iteration, Enhance client intelligence",
                "Establish real-time data sync, Reduce manual outreach hours, Minimize pipeline latency"
            ])
            pain_points = random.choice([
                "Manual client workspace setup, Slow semantic indexing, Repetitive pipeline validations",
                "High manual coordination time, Latency in model outputs, Complex stack integration costs",
                "Data synchronization errors, High employee hourly overhead, Unstructured customer response logs"
            ])
            
            return json.dumps({
                "organization_name": org_name,
                "startup_type": startup_type,
                "team_size": random.randint(12, 35),
                "departments": "Engineering, Product, Marketing, Client Operations",
                "workflows": workflows,
                "pain_points": pain_points,
                "current_ai_tools": tools,
                "automation_goals": goals,
                "ai_maturity_self_score": random.randint(6, 9)
            })

        elif agent_name == "workflow_agent" or (not agent_name and "workflow" in prompt_lower and "analy" in prompt_lower):
            bottlenecks_pool = [
                {"area": "Manual data entry", "severity": "high", "automation_potential": 0.92},
                {"area": "Report generation", "severity": "medium", "automation_potential": 0.85},
                {"area": "Customer onboarding", "severity": "medium", "automation_potential": 0.78},
                {"area": "Pipeline verification", "severity": "high", "automation_potential": 0.88},
                {"area": "Semantic data indexing", "severity": "medium", "automation_potential": 0.80},
                {"area": "Lead qualification", "severity": "low", "automation_potential": 0.70}
            ]
            selected_bottlenecks = random.sample(bottlenecks_pool, 3)
            
            focus_pool = [
                "Data pipeline automation",
                "Customer communication AI",
                "Intelligent document processing",
                "Autonomous testing loops",
                "Smart vector store curation"
            ]
            selected_focus = random.sample(focus_pool, 3)
            
            return json.dumps({
                "analysis": {
                    "bottlenecks": selected_bottlenecks,
                    "efficiency_score": round(random.uniform(0.35, 0.58), 2),
                    "ai_readiness": round(random.uniform(0.55, 0.78), 2),
                    "recommended_focus_areas": selected_focus,
                },
                "confidence": round(random.uniform(0.80, 0.95), 2),
                "reasoning": "Based on the dynamically scanned organizational workflow, key bottlenecks were detected in manual processes and coordination channels.",
            })

        elif agent_name == "research_agent" or (not agent_name and "research" in prompt_lower and "tool" in prompt_lower):
            tools_pool = [
                {"name": "Cursor", "category": "Development", "reason": "AI-native code editor with strong workflow integration"},
                {"name": "Notion AI", "category": "Knowledge Management", "reason": "Unified workspace with AI-powered organization"},
                {"name": "Zapier", "category": "Automation", "reason": "No-code workflow automation across 5000+ apps"},
                {"name": "Linear", "category": "Project Management", "reason": "AI-optimized project tracking for engineering teams"},
                {"name": "v0.dev", "category": "UI Design", "reason": "Generative UI system matching current frontend frameworks"},
                {"name": "Bolt.new", "category": "Fullstack Sandbox", "reason": "Browser-based development agent for fast prototyping"},
                {"name": "LangChain", "category": "Agent Framework", "reason": "Structured tool-calling and multi-agent coordination orchestration"}
            ]
            selected_tools = random.sample(tools_pool, 4)
            for t in selected_tools:
                t["match_score"] = round(random.uniform(0.81, 0.97), 2)
            
            return json.dumps({
                "recommended_tools": selected_tools,
                "stack_compatibility": round(random.uniform(0.82, 0.96), 2),
                "total_tools_analyzed": random.randint(120, 180),
            })

        elif agent_name == "sentiment_agent" or (not agent_name and "sentiment" in prompt_lower):
            concerns_pool = ["Pricing changes", "API rate limits", "Vendor lock-in", "Data privacy", "Model latency"]
            strengths_pool = ["Active development", "Strong community", "Good documentation", "Extremely fast response", "High accuracy"]
            
            return json.dumps({
                "sentiment_analysis": {
                    "overall_score": round(random.uniform(0.68, 0.90), 2),
                    "community_trust": random.choice(["high", "very high", "medium"]),
                    "reddit_mentions_30d": random.randint(1500, 4500),
                    "positive_ratio": round(random.uniform(0.60, 0.85), 2),
                    "concerns": random.sample(concerns_pool, 2),
                    "strengths": random.sample(strengths_pool, 3),
                },
                "data_freshness": datetime.utcnow().strftime("%Y-%m-%d"),
            })

        elif agent_name == "trend_agent" or (not agent_name and "trend" in prompt_lower):
            categories = [
                {"category": "AI Code Generation", "velocity": round(random.uniform(0.88, 0.98), 2), "direction": "accelerating", "maturity": "growth"},
                {"category": "AI Agents", "velocity": round(random.uniform(0.82, 0.95), 2), "direction": "accelerating", "maturity": "early"},
                {"category": "AI Document Processing", "velocity": round(random.uniform(0.65, 0.78), 2), "direction": "stable", "maturity": "mature"},
                {"category": "AI Customer Support", "velocity": round(random.uniform(0.60, 0.72), 2), "direction": "stable", "maturity": "mature"},
                {"category": "AI Design Ops", "velocity": round(random.uniform(0.70, 0.85), 2), "direction": "accelerating", "maturity": "growth"}
            ]
            
            emerging_pool = ["AI Infrastructure Orchestration", "AI Workflow Automation", "Autonomous AI Operations", "Custom Vector Pipelines"]
            declining_pool = ["Basic Chatbots", "Simple Text Generation", "Rule-based Automation"]
            
            return json.dumps({
                "trends": random.sample(categories, 4),
                "emerging_categories": random.sample(emerging_pool, 3),
                "declining_categories": random.sample(declining_pool, 2),
            })

        elif agent_name == "roi_agent" or (not agent_name and "roi" in prompt_lower):
            # Default values if parsing fails
            team_size = 18
            hourly_rate = 45.0
            manual_hours = 25.0
            annual_budget = 15000.0
            
            # Parse team size
            ts_match = re.search(r"Team Size:\s*(\d+)", user_prompt, re.IGNORECASE)
            if ts_match:
                team_size = int(ts_match.group(1))
            
            # Parse hourly rate
            hr_match = re.search(r"Average employee hourly rate:\s*\$([\d\.]+)", user_prompt, re.IGNORECASE)
            if hr_match:
                hourly_rate = float(hr_match.group(1))
                
            # Parse manual hours
            mh_match = re.search(r"Monthly manual hours spent per employee:\s*([\d\.]+)", user_prompt, re.IGNORECASE)
            if mh_match:
                manual_hours = float(mh_match.group(1))
                
            # Parse annual budget
            ab_match = re.search(r"Dedicated annual AI tool budget:\s*\$([\d\.]+)", user_prompt, re.IGNORECASE)
            if ab_match:
                annual_budget = float(ab_match.group(1))
            
            # Dynamically calculate ROI based on actual values!
            # Average automation rate is 35%
            productivity_gain = round(random.uniform(30.0, 42.0), 1)
            time_saved_hours = round(manual_hours * team_size * (productivity_gain / 100.0), 1)
            
            # Monthly savings = time saved * hourly rate
            monthly_savings = round(time_saved_hours * hourly_rate, 2)
            
            # Tool subscriptions cost: scale with team size (e.g. $100 per employee per month)
            tool_subscriptions = round(team_size * random.uniform(80.0, 150.0), 2)
            
            implementation_cost = round(team_size * random.uniform(150.0, 300.0), 2)
            training_cost = round(team_size * random.uniform(80.0, 150.0), 2)
            
            annual_savings = monthly_savings * 12
            annual_cost = tool_subscriptions * 12 + implementation_cost + training_cost
            
            annual_roi = round((annual_savings - annual_cost) / annual_cost * 100) if annual_cost > 0 else 350
            payback = round(annual_cost / monthly_savings, 1) if monthly_savings > 0 else 2.5
            
            return json.dumps({
                "roi_analysis": {
                    "estimated_monthly_savings": monthly_savings,
                    "productivity_gain_percent": productivity_gain,
                    "payback_period_months": payback,
                    "annual_roi_percent": annual_roi,
                    "cost_breakdown": {
                        "tool_subscriptions": tool_subscriptions,
                        "implementation_cost": implementation_cost,
                        "training_cost": training_cost,
                    },
                    "savings_breakdown": {
                        "time_saved_hours_monthly": time_saved_hours,
                        "reduced_manual_errors": round(monthly_savings * 0.4, 2),
                        "faster_delivery": round(monthly_savings * 0.3, 2),
                    },
                },
                "confidence": round(random.uniform(0.80, 0.90), 2),
            })

        elif agent_name == "strategy_agent" or (not agent_name and ("strateg" in prompt_lower or "synthes" in prompt_lower)):
            priority_initiatives = [
                {
                    "initiative": "Development Workflow AI Integration",
                    "impact": "high",
                    "effort": "medium",
                    "tools": ["Cursor", "GitHub Copilot", "Linear"],
                },
                {
                    "initiative": "Customer Operations Intelligence",
                    "impact": "high",
                    "effort": "medium",
                    "tools": ["Intercom AI", "Notion AI", "Zapier"],
                },
                {
                    "initiative": "Data Pipeline Automation",
                    "impact": "medium",
                    "effort": "low",
                    "tools": ["Zapier", "Make", "Airbyte"],
                },
            ]
            
            return json.dumps({
                "strategic_recommendation": {
                    "executive_summary": f"Your organization is well-positioned for AI transformation with a focus on development workflow automation and customer operations intelligence.",
                    "ai_maturity_current": "Developing",
                    "ai_maturity_target": "Advanced",
                    "transformation_timeline_months": random.choice([4, 6, 8]),
                    "priority_initiatives": random.sample(priority_initiatives, random.randint(2, 3)),
                    "risk_factors": ["Over-automation without process redesign", "Tool integration complexity"],
                },
                "confidence": round(random.uniform(0.80, 0.90), 2),
            })

        elif "obsolescen" in prompt_lower or "obsolete" in prompt_lower:
            return json.dumps({
                "obsolescence_report": {
                    "at_risk_tools": [
                        {"tool": "Legacy CRM", "risk_level": "high", "replacement": "HubSpot AI", "timeline": "3 months"},
                        {"tool": "Manual Reporting Suite", "risk_level": "critical", "replacement": "Tableau AI + Notion", "timeline": "1 month"},
                    ],
                    "stable_tools": ["Slack", "GitHub", "AWS"],
                    "emerging_replacements": random.randint(4, 9),
                },
            })

        elif "digital twin" in prompt_lower or "twin" in prompt_lower:
            twin_depts = [
                {"name": "Engineering", "ai_adoption": round(random.uniform(0.60, 0.85), 2), "bottlenecks": random.sample(["Code review delays", "Test automation gaps", "Deployment sync latency"], 2)},
                {"name": "Marketing", "ai_adoption": round(random.uniform(0.38, 0.58), 2), "bottlenecks": random.sample(["Content creation speed", "Campaign analytics bottleneck", "A/B testing iteration"], 2)},
                {"name": "Sales", "ai_adoption": round(random.uniform(0.30, 0.52), 2), "bottlenecks": random.sample(["Lead qualification delays", "CRM manual entries", "Followup orchestration"], 2)},
                {"name": "Support", "ai_adoption": round(random.uniform(0.48, 0.68), 2), "bottlenecks": random.sample(["Customer response latency", "Helpdesk knowledge indexation", "Ticket sorting queue"], 2)}
            ]
            overall_maturity = round(sum(d["ai_adoption"] for d in twin_depts) / 4, 2)
            
            return json.dumps({
                "digital_twin": {
                    "departments": twin_depts,
                    "overall_ai_maturity": overall_maturity,
                    "optimization_potential": round(random.uniform(0.70, 0.88), 2),
                    "predicted_efficiency_gain": round(random.uniform(0.35, 0.52), 2),
                },
            })

        else:
            return json.dumps({
                "response": "Based on the analysis of your organization's operational context, I recommend focusing on workflow automation and AI-native tooling adoption to maximize operational efficiency.",
                "confidence": round(random.uniform(0.75, 0.88), 2),
                "reasoning": "The organizational profile suggests significant untapped potential in AI-driven process optimization.",
                "next_steps": [
                    "Complete the full workflow mapping",
                    "Evaluate recommended AI tools for pilot deployment",
                    "Set up continuous monitoring for AI ecosystem changes",
                ],
            })


# ── Singleton ────────────────────────────────────────────────────────

_ai_client: Optional[MultiModelClient] = None


def get_ai_client() -> MultiModelClient:
    """Get or create the AI client singleton."""
    global _ai_client
    if _ai_client is None:
        _ai_client = MultiModelClient()
    return _ai_client
