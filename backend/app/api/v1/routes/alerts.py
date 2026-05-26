"""
AdaptiveAI — Alert Routes
============================
"""

from fastapi import APIRouter, HTTPException
from app.services.alert_service import AlertService
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/{org_id}", response_model=list[AlertResponse])
async def get_alerts(org_id: str, include_dismissed: bool = False):
    """Get alerts for an organization."""
    service = AlertService()
    return await service.get_for_organization(org_id, include_dismissed)


@router.put("/{alert_id}/dismiss", response_model=AlertResponse)
async def dismiss_alert(alert_id: str):
    """Dismiss an alert."""
    try:
        service = AlertService()
        return await service.dismiss(alert_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{org_id}/summary")
async def get_alert_summary(org_id: str):
    """Get alert summary for an organization."""
    service = AlertService()
    return await service.get_summary(org_id)


@router.post("/{org_id}/news-check", response_model=list[AlertResponse])
async def trigger_news_check(org_id: str):
    """Scan tech news and ecosystem signals for threats to the organization's stack."""
    try:
        service = AlertService()
        return await service.trigger_news_check(org_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
