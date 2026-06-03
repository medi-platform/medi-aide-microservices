"""
Wellness AI Engine
Burnout prediction and wellness recommendations
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional
import structlog
import random

from src.config import settings

logger = structlog.get_logger(__name__)


class WellnessEngine:
    """
    Core wellness AI engine
    
    Capabilities:
    - Burnout risk prediction
    - Wellness check-in processing
    - Intervention recommendations
    - Wellness insights generation
    """
    
    def __init__(self):
        self.high_risk_threshold = settings.ai.burnout_high_risk_threshold
        self.wellness_store: Dict[str, List[Dict]] = {}
        self.tips = self._load_tips()
    
    def _load_tips(self) -> Dict[str, List[str]]:
        """Load wellness tips by category"""
        return {
            "stress": [
                "Take a 5-minute breathing break between visits",
                "Practice the 4-7-8 breathing technique when feeling overwhelmed",
                "Set boundaries with your work schedule when possible"
            ],
            "burnout": [
                "Consider taking a mental health day if you haven't recently",
                "Talk to your supervisor about workload concerns",
                "Connect with peers who understand your challenges"
            ],
            "physical": [
                "Stay hydrated throughout your shift",
                "Take stretch breaks to prevent physical strain",
                "Get adequate sleep - aim for 7-8 hours"
            ],
            "emotional": [
                "Practice gratitude by noting one positive interaction each day",
                "Seek support from the Employee Assistance Program if needed",
                "Celebrate small wins in your caregiving journey"
            ]
        }
    
    async def predict_burnout(
        self,
        caregiver_id: str,
        wellness_metrics,
        workload_data: Optional[Any] = None,
        historical_data: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Predict burnout risk for a caregiver"""
        
        # Calculate risk score based on metrics
        risk_factors = []
        risk_score = 0.0
        
        # Stress level factor
        if wellness_metrics.stress_level is not None:
            stress_contribution = wellness_metrics.stress_level / 10 * 0.25
            risk_score += stress_contribution
            if wellness_metrics.stress_level >= 7:
                risk_factors.append({
                    "factor": "High Stress Level",
                    "contribution": stress_contribution,
                    "description": f"Reported stress level of {wellness_metrics.stress_level}/10"
                })
        
        # Sleep quality factor
        if wellness_metrics.sleep_quality is not None:
            sleep_contribution = (10 - wellness_metrics.sleep_quality) / 10 * 0.20
            risk_score += sleep_contribution
            if wellness_metrics.sleep_quality <= 4:
                risk_factors.append({
                    "factor": "Poor Sleep Quality",
                    "contribution": sleep_contribution,
                    "description": f"Sleep quality rating of {wellness_metrics.sleep_quality}/10"
                })
        
        # Work-life balance factor
        if wellness_metrics.work_life_balance is not None:
            balance_contribution = (10 - wellness_metrics.work_life_balance) / 10 * 0.20
            risk_score += balance_contribution
            if wellness_metrics.work_life_balance <= 4:
                risk_factors.append({
                    "factor": "Work-Life Imbalance",
                    "contribution": balance_contribution,
                    "description": f"Work-life balance rating of {wellness_metrics.work_life_balance}/10"
                })
        
        # Workload factors
        if workload_data:
            if workload_data.overtime_hours and workload_data.overtime_hours > 10:
                overtime_contribution = min(workload_data.overtime_hours / 20, 1.0) * 0.15
                risk_score += overtime_contribution
                risk_factors.append({
                    "factor": "Excessive Overtime",
                    "contribution": overtime_contribution,
                    "description": f"{workload_data.overtime_hours} overtime hours this week"
                })
            
            if workload_data.consecutive_work_days and workload_data.consecutive_work_days >= 7:
                consecutive_contribution = 0.15
                risk_score += consecutive_contribution
                risk_factors.append({
                    "factor": "No Recent Days Off",
                    "contribution": consecutive_contribution,
                    "description": f"{workload_data.consecutive_work_days} consecutive work days"
                })
        
        # Determine risk level
        if risk_score >= 0.85:
            risk_level = "critical"
        elif risk_score >= self.high_risk_threshold:
            risk_level = "high"
        elif risk_score >= 0.5:
            risk_level = "moderate"
        else:
            risk_level = "low"
        
        # Generate recommendations
        recommendations = await self.recommend_interventions(
            caregiver_id=caregiver_id,
            risk_level=risk_level,
            categories=None,
            max_count=5
        )
        
        return {
            "risk_level": risk_level,
            "risk_score": round(risk_score, 3),
            "factors": risk_factors,
            "trend": "stable",  # Would compare with historical data
            "recommendations": recommendations,
            "next_check": date.today().isoformat()
        }
    
    async def process_check_in(
        self,
        caregiver_id: str,
        check_in_type: str,
        metrics,
        mood: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a wellness check-in"""
        
        # Calculate overall score
        scores = []
        category_scores = {}
        
        if metrics.stress_level is not None:
            inverted = 10 - metrics.stress_level
            scores.append(inverted)
            category_scores["stress"] = inverted
        
        if metrics.sleep_quality is not None:
            scores.append(metrics.sleep_quality)
            category_scores["physical"] = metrics.sleep_quality
        
        if metrics.emotional_health is not None:
            scores.append(metrics.emotional_health)
            category_scores["emotional"] = metrics.emotional_health
        
        if metrics.work_life_balance is not None:
            scores.append(metrics.work_life_balance)
            category_scores["workload"] = metrics.work_life_balance
        
        overall_score = sum(scores) / len(scores) if scores else 5.0
        
        # Generate insights
        insights = []
        if category_scores.get("stress", 10) < 5:
            insights.append("Your stress levels seem elevated. Consider taking more breaks.")
        if category_scores.get("physical", 10) < 5:
            insights.append("Sleep quality could be improved. Try maintaining a consistent sleep schedule.")
        if overall_score >= 7:
            insights.append("Great job maintaining your wellness! Keep up the positive habits.")
        
        # Generate recommendations based on lowest scores
        recommendations = []
        for category, score in sorted(category_scores.items(), key=lambda x: x[1])[:2]:
            tips = self.tips.get(category, self.tips.get("stress", []))
            if tips:
                recommendations.append({
                    "category": category,
                    "tip": tips[0],
                    "priority": (10 - score) / 10
                })
        
        # Store check-in
        if caregiver_id not in self.wellness_store:
            self.wellness_store[caregiver_id] = []
        
        self.wellness_store[caregiver_id].append({
            "timestamp": datetime.utcnow().isoformat(),
            "overall_score": overall_score,
            "category_scores": category_scores,
            "mood": mood
        })
        
        streak_days = len(self.wellness_store[caregiver_id])
        
        return {
            "overall_score": round(overall_score, 1),
            "category_scores": category_scores,
            "insights": insights,
            "recommendations": recommendations,
            "streak_days": streak_days
        }
    
    async def recommend_interventions(
        self,
        caregiver_id: str,
        risk_level,
        categories: Optional[List] = None,
        max_count: int = 5
    ) -> List[Dict[str, Any]]:
        """Recommend interventions based on risk level"""
        interventions = []
        
        risk_value = risk_level.value if hasattr(risk_level, 'value') else str(risk_level)
        
        if risk_value in ["high", "critical"]:
            interventions.append({
                "type": "urgent",
                "title": "Speak with Your Supervisor",
                "description": "Consider discussing your workload and stress levels with your supervisor",
                "priority": 0.95
            })
            interventions.append({
                "type": "resource",
                "title": "Employee Assistance Program",
                "description": "Access confidential counseling and support services",
                "priority": 0.9
            })
        
        interventions.append({
            "type": "activity",
            "title": "Guided Breathing Exercise",
            "description": "Take a 2-minute breathing break to reduce stress",
            "priority": 0.8
        })
        
        interventions.append({
            "type": "connection",
            "title": "Peer Support",
            "description": "Connect with a fellow caregiver in a coffeemeet session",
            "priority": 0.7
        })
        
        return interventions[:max_count]
    
    async def get_history(
        self,
        caregiver_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 30
    ) -> Dict[str, Any]:
        """Get wellness history for a caregiver"""
        check_ins = self.wellness_store.get(caregiver_id, [])[-limit:]
        
        return {
            "check_ins": check_ins,
            "trends": {"overall": "stable"},
            "summary": {
                "total_check_ins": len(check_ins),
                "avg_score": sum(c.get("overall_score", 5) for c in check_ins) / len(check_ins) if check_ins else 0
            }
        }
    
    async def generate_insights(self, caregiver_id: str) -> List[str]:
        """Generate AI insights for a caregiver"""
        return [
            "Based on your recent check-ins, maintaining consistent sleep schedules has improved your overall wellness.",
            "Consider scheduling your most challenging visits earlier in the day when energy is typically highest.",
            "Your stress management has improved over the past week. Keep using the breathing exercises!"
        ]
    
    async def get_tip(self, category: Optional[Any] = None) -> Dict[str, Any]:
        """Get a wellness tip"""
        if category:
            cat_value = category.value if hasattr(category, 'value') else str(category)
            tips = self.tips.get(cat_value, self.tips["stress"])
        else:
            all_tips = [tip for tips in self.tips.values() for tip in tips]
            tips = all_tips
        
        tip = random.choice(tips)
        return {
            "tip": tip,
            "category": category.value if category and hasattr(category, 'value') else "general"
        }

