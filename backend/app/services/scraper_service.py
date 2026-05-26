"""
AdaptiveAI — Web Scraper Onboarding Service
===========================================
Crawls and crawls websites, cleans visible content, and leverages the LLM
to extract structural operational details (onboarding data).
Automatically triggers multi-agent synthesis and logs results directly to Google Sheets!
"""

import httpx
import json
from bs4 import BeautifulSoup
from app.storage.sheet_manager import get_sheet_manager
from app.core.ai_client import get_ai_client
from app.services.organization_service import OrganizationService
from app.services.digital_twin_service import DigitalTwinService
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.organization import OnboardingData
from app.core.logging import get_logger

logger = get_logger("scraper_service")


class ScraperService:
    """Crawls websites and uses LLMs to extract startup operational metrics."""

    def __init__(self):
        self.sheets = get_sheet_manager()
        self.ai = get_ai_client()
        self.org_service = OrganizationService()

    async def scrape_and_analyze(self, org_id: str, url: str) -> dict:
        """
        Crawls a website URL, parses text content, uses AI to extract onboarding parameters,
        saves to ORGANIZATIONS_MASTER, and kicks off multi-agent workflow analysis.
        """
        logger.info(f"Crawling URL: {url} for organization {org_id}...")

        # 1. Fetch HTML content
        html_content = ""
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

        # Handle missing protocol
        crawl_url = url.strip()
        if not crawl_url.startswith(("http://", "https://")):
            crawl_url = "https://" + crawl_url

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                res = await client.get(crawl_url, headers=headers)
                res.raise_for_status()
                html_content = res.text
                logger.info(f"Successfully downloaded HTML from: {crawl_url}")
        except Exception as e:
            logger.error(f"Failed to crawl {crawl_url}: {e}")
            raise ValueError(f"Could not connect to {crawl_url}. Please verify the URL and try again.")

        # 2. Extract and clean visible text
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Decompose only technical elements (scripts, styling, embeds) to preserve the entire webpage content
            for element in soup(["script", "style", "noscript", "iframe"]):
                element.decompose()
                
            raw_text = soup.get_text(separator=" ")
            clean_text = " ".join(raw_text.split())
            
            # Limit characters to fit in token contexts while fully capturing the landing page (approx. 3000 tokens)
            scraped_content = clean_text[:12000]
            logger.info(f"Cleaned website text length: {len(scraped_content)} characters")
        except Exception as e:
            logger.error(f"Error parsing HTML content: {e}")
            raise ValueError("Failed to extract semantic content from the website HTML.")

        # 3. Use AI to extract structured onboarding details
        system_prompt = (
            "You are a elite operational architect. Your job is to analyze the provided landing page text "
            "for a startup/organization and extract key organizational structure, workflows, bottlenecks, and "
            "tech stack parameters. Respond ONLY with a valid, clean JSON object matching the requested schema. "
            "Do not return any markdown code fences, comments, or extra conversational text."
        )

        user_prompt = f"""
Analyze this scraped website text:
---
URL: {crawl_url}
CONTENT:
{scraped_content}
---

Extract the following variables into a clean JSON structure:
1. "organization_name": Exact name of the startup/company.
2. "startup_type": Categorize the business model into exactly one of: "SaaS", "AI-native", "E-commerce", "Fintech", "HealthTech", "Agency", "Enterprise", or "Other".
3. "team_size": Estimate the number of employees (integer) based on product scale, or default to 15.
4. "departments": A comma-separated list of likely key departments (e.g. "Engineering, Sales, Marketing, Support").
5. "workflows": 2 to 3 typical operational workflows they run (e.g. "Product Development > QA > Release, Inbound Lead > Qualification > Demo").
6. "pain_points": 2 to 3 typical bottlenecks or frustrations they likely solve or face (e.g. "Manual customer onboarding, Slow content drafting, Repetitive support queries").
7. "current_ai_tools": A comma-separated list of likely AI tools they already use or would benefit from (e.g. "GitHub Copilot, Jasper, ChatGPT, Zapier").
8. "automation_goals": 2 to 3 explicit automation goals based on their product offerings (e.g. "Automate lead scoring, Build AI customer service agent, Optimize deployment pipelines").
9. "ai_maturity_self_score": Estimate their AI maturity self-score on a scale from 1 to 10 (integer).

JSON Schema to return:
{{
  "organization_name": "string",
  "startup_type": "string",
  "team_size": int,
  "departments": "string",
  "workflows": "string",
  "pain_points": "string",
  "current_ai_tools": "string",
  "automation_goals": "string",
  "ai_maturity_self_score": int
}}
"""

        try:
            logger.info("Executing live AI extraction call...")
            ai_response = await self.ai.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                agent_name="workflow_agent",  # Use specialized workflow mapping
                response_format="json"
            )
            
            # Load and parse the response JSON
            extracted_data = json.loads(ai_response)
            logger.info(f"AI Extraction Successful. Extracted Org Name: {extracted_data.get('organization_name')}")
        except Exception as e:
            logger.error(f"LLM semantic extraction failed: {e}")
            raise ValueError(f"Live AI failed to synthesize operational details from your website: {e}")

        # 4. Process the onboarding flow and commit to Google Sheets database
        try:
            # Map values, ensuring type compliance
            onboarding_payload = OnboardingData(
                organization_name=extracted_data.get("organization_name") or f"Startup {org_id[:6]}",
                startup_type=extracted_data.get("startup_type") or "SaaS",
                team_size=int(extracted_data.get("team_size") or 15),
                departments=extracted_data.get("departments") or "Engineering, Marketing, Sales",
                workflows=extracted_data.get("workflows") or "Product Development > Deploy",
                current_ai_tools=extracted_data.get("current_ai_tools") or "ChatGPT, GitHub Copilot",
                pain_points=extracted_data.get("pain_points") or "Manual data entry, Repetitive queries",
                automation_goals=extracted_data.get("automation_goals") or "Automate workflows",
                ai_maturity_self_score=int(extracted_data.get("ai_maturity_self_score") or 4)
            )

            # Save startup to USERS_MASTER & ORGANIZATIONS_MASTER
            result = await self.org_service.process_onboarding(org_id, onboarding_payload)
            logger.info(f"Committed scraped onboarding details to ORGANIZATIONS_MASTER for {org_id}")

            # 5. Trigger Multi-Agent Orchestrator analysis in the background
            try:
                logger.info("Running live AgentOrchestrator workflow analysis...")
                orchestrator = AgentOrchestrator()
                await orchestrator.full_analysis(org_id)
                logger.info("Live multi-agent workflow analysis complete.")
            except Exception as analysis_err:
                logger.error(f"Multi-agent reasoning pass failed: {analysis_err}")

            # 6. Generate virtual Digital Twin Bottlenecks mapping
            try:
                logger.info("Generating virtual Digital Twin operational maps...")
                twin_service = DigitalTwinService()
                await twin_service.generate_mock_twin(org_id)
                logger.info("Digital twin generation complete.")
            except Exception as twin_err:
                logger.error(f"Digital twin generation failed: {twin_err}")

            # Fetch the completed dashboard structure
            dashboard_data = await self.org_service.get_dashboard(org_id)
            return dashboard_data.model_dump()

        except Exception as e:
            logger.error(f"Failed to commit scraped operational parameters to sheets: {e}")
            raise ValueError(f"Database commit error: {e}")
