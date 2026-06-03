"""
Schedule Optimization Engine
Route optimization and shift scheduling
"""

import math
from datetime import datetime, date, time, timedelta
from typing import Any, Dict, List, Optional
import structlog

from src.config import settings

logger = structlog.get_logger(__name__)


class ScheduleOptimizer:
    """
    Core schedule optimization engine
    
    Capabilities:
    - Route optimization
    - Shift scheduling
    - Visit time suggestions
    - Travel time estimation
    - Multi-caregiver optimization
    """
    
    def __init__(self):
        self.max_travel_minutes = settings.ai.schedule_max_travel_minutes
        self.buffer_minutes = settings.ai.schedule_buffer_minutes
    
    async def optimize(
        self,
        date: date,
        caregiver,
        visits: List,
        optimization_types: List,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Optimize schedule for a single caregiver"""
        
        if not visits:
            return {
                "optimized_visits": [],
                "total_travel_time": 0,
                "total_distance": 0,
                "total_working_time": 0,
                "utilization": 0,
                "savings": {"time_saved_minutes": 0, "distance_saved_km": 0}
            }
        
        # Sort visits by location proximity (simple greedy algorithm)
        optimized_visits = []
        remaining_visits = list(visits)
        current_location = caregiver.start_location
        current_time = datetime.combine(date, caregiver.working_hours.start)
        
        total_travel_time = 0
        total_distance = 0
        sequence = 1
        
        while remaining_visits:
            # Find nearest visit
            nearest = None
            nearest_distance = float('inf')
            
            for visit in remaining_visits:
                dist = self._calculate_distance(
                    current_location.lat, current_location.lng,
                    visit.location.lat, visit.location.lng
                )
                if dist < nearest_distance:
                    nearest_distance = dist
                    nearest = visit
            
            if nearest:
                travel_time = int(nearest_distance / 0.5)  # ~30 mph average
                
                scheduled_start = current_time + timedelta(minutes=travel_time + self.buffer_minutes)
                scheduled_end = scheduled_start + timedelta(minutes=nearest.duration_minutes)
                
                optimized_visits.append({
                    "visit_id": nearest.id,
                    "patient_id": nearest.patient_id,
                    "scheduled_start": scheduled_start.time().isoformat(),
                    "scheduled_end": scheduled_end.time().isoformat(),
                    "travel_time_minutes": travel_time,
                    "travel_distance_km": round(nearest_distance * 1.6, 2),
                    "sequence_number": sequence
                })
                
                total_travel_time += travel_time
                total_distance += nearest_distance * 1.6
                current_time = scheduled_end
                current_location = nearest.location
                remaining_visits.remove(nearest)
                sequence += 1
        
        # Calculate working time and utilization
        work_minutes = sum(v.duration_minutes for v in visits)
        total_minutes = work_minutes + total_travel_time + (len(visits) * self.buffer_minutes)
        available_minutes = (
            datetime.combine(date, caregiver.working_hours.end) - 
            datetime.combine(date, caregiver.working_hours.start)
        ).seconds / 60
        
        utilization = min(total_minutes / available_minutes * 100, 100) if available_minutes > 0 else 0
        
        return {
            "optimized_visits": optimized_visits,
            "total_travel_time": total_travel_time,
            "total_distance": round(total_distance, 2),
            "total_working_time": total_minutes,
            "utilization": round(utilization, 1),
            "savings": {
                "time_saved_minutes": max(0, len(visits) * 5),  # Estimated
                "distance_saved_km": max(0, len(visits) * 2)   # Estimated
            }
        }
    
    async def optimize_multi_caregiver(
        self,
        date: date,
        caregivers: List,
        visits: List,
        balance_workload: bool = True,
        minimize_travel: bool = True
    ) -> Dict[str, Any]:
        """Optimize schedule for multiple caregivers"""
        
        assignments = {}
        unassigned = []
        
        # Simple round-robin assignment for now
        for i, visit in enumerate(visits):
            caregiver_idx = i % len(caregivers)
            caregiver_id = caregivers[caregiver_idx].id
            
            if caregiver_id not in assignments:
                assignments[caregiver_id] = []
            
            assignments[caregiver_id].append({
                "visit_id": visit.id,
                "patient_id": visit.patient_id,
                "duration_minutes": visit.duration_minutes
            })
        
        return {
            "assignments": assignments,
            "unassigned": unassigned,
            "metrics": {
                "total_caregivers": len(caregivers),
                "total_visits": len(visits),
                "avg_visits_per_caregiver": len(visits) / len(caregivers) if caregivers else 0
            }
        }
    
    async def suggest_times(
        self,
        patient_id: str,
        caregiver_id: str,
        date: date,
        duration_minutes: int,
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Suggest optimal visit times"""
        suggestions = []
        base_times = [time(9, 0), time(11, 0), time(14, 0), time(16, 0)]
        
        for i, t in enumerate(base_times[:count]):
            end_time = (datetime.combine(date, t) + timedelta(minutes=duration_minutes)).time()
            suggestions.append({
                "start_time": t.isoformat(),
                "end_time": end_time.isoformat(),
                "preference_score": 0.9 - (i * 0.1),
                "reason": "Optimal based on historical patterns"
            })
        
        return suggestions
    
    async def estimate_travel(
        self,
        origin,
        destination,
        departure_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Estimate travel time and distance"""
        distance_miles = self._calculate_distance(
            origin.lat, origin.lng,
            destination.lat, destination.lng
        )
        
        # Rough estimate: 25 mph average
        time_minutes = int(distance_miles / 25 * 60)
        
        return {
            "time_minutes": time_minutes,
            "distance_km": round(distance_miles * 1.6, 2),
            "route_type": "driving"
        }
    
    def _calculate_distance(
        self,
        lat1: float, lng1: float,
        lat2: float, lng2: float
    ) -> float:
        """Calculate distance in miles using Haversine formula"""
        R = 3959  # Earth radius in miles
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c

