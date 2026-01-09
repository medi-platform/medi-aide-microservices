/**
 * Care Recommendations Engine
 * Provides AI-powered care recommendations
 */

import { Injectable } from '@nestjs/common';

export interface PatientContext {
  patientId: string;
  age: number;
  conditions: string[];
  medications: string[];
  allergies: string[];
  careLevel: 'low' | 'medium' | 'high' | 'critical';
  recentVitals: { type: string; value: number; date: Date }[];
  recentIncidents: { type: string; date: Date; severity: string }[];
  careHistory: { type: string; frequency: number; lastProvided: Date }[];
}

export interface CareRecommendation {
  type: 'task' | 'monitoring' | 'intervention' | 'referral' | 'education';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  frequency?: string;
  targetMetrics?: string[];
}

export interface TaskSuggestion {
  taskType: string;
  suggestedTime: string;
  duration: number; // minutes
  priority: 'low' | 'medium' | 'high';
  rationale: string;
}

// Knowledge base for condition-based recommendations
const CONDITION_RECOMMENDATIONS: Record<string, CareRecommendation[]> = {
  diabetes: [
    {
      type: 'monitoring',
      priority: 'high',
      title: 'Blood Glucose Monitoring',
      description: 'Monitor blood glucose levels regularly',
      rationale: 'Essential for diabetes management',
      frequency: 'Before each meal and at bedtime',
      targetMetrics: ['blood_glucose'],
    },
    {
      type: 'task',
      priority: 'medium',
      title: 'Foot Inspection',
      description: 'Inspect feet daily for cuts, blisters, or changes',
      rationale: 'Diabetic patients are at risk for foot complications',
      frequency: 'Daily',
    },
    {
      type: 'education',
      priority: 'medium',
      title: 'Diet Education',
      description: 'Reinforce carbohydrate counting and meal planning',
      rationale: 'Dietary management is key to glucose control',
    },
  ],
  hypertension: [
    {
      type: 'monitoring',
      priority: 'high',
      title: 'Blood Pressure Monitoring',
      description: 'Monitor blood pressure twice daily',
      rationale: 'Track effectiveness of treatment',
      frequency: 'Morning and evening',
      targetMetrics: ['blood_pressure_systolic', 'blood_pressure_diastolic'],
    },
    {
      type: 'task',
      priority: 'medium',
      title: 'Medication Adherence Check',
      description: 'Ensure all antihypertensive medications are taken as prescribed',
      rationale: 'Medication adherence is crucial for blood pressure control',
    },
    {
      type: 'education',
      priority: 'low',
      title: 'Low Sodium Diet',
      description: 'Educate on sodium restriction',
      rationale: 'Dietary sodium impacts blood pressure',
    },
  ],
  dementia: [
    {
      type: 'task',
      priority: 'high',
      title: 'Safety Assessment',
      description: 'Assess environment for safety hazards',
      rationale: 'Dementia patients are at increased fall risk',
      frequency: 'Each visit',
    },
    {
      type: 'monitoring',
      priority: 'medium',
      title: 'Cognitive Status',
      description: 'Monitor for changes in confusion or behavior',
      rationale: 'Track disease progression',
      frequency: 'Each visit',
    },
    {
      type: 'intervention',
      priority: 'medium',
      title: 'Structured Routine',
      description: 'Maintain consistent daily routines',
      rationale: 'Routine reduces confusion and agitation',
    },
  ],
  'fall risk': [
    {
      type: 'task',
      priority: 'high',
      title: 'Fall Risk Assessment',
      description: 'Complete standardized fall risk assessment',
      rationale: 'Identify and mitigate fall risks',
      frequency: 'Weekly',
    },
    {
      type: 'intervention',
      priority: 'high',
      title: 'Mobility Assistance',
      description: 'Provide assistance with ambulation',
      rationale: 'Prevent falls during movement',
    },
    {
      type: 'task',
      priority: 'medium',
      title: 'Home Safety Check',
      description: 'Remove trip hazards, ensure adequate lighting',
      rationale: 'Environmental modifications reduce fall risk',
    },
  ],
  copd: [
    {
      type: 'monitoring',
      priority: 'high',
      title: 'Oxygen Saturation Monitoring',
      description: 'Monitor SpO2 levels regularly',
      rationale: 'Detect respiratory decline early',
      frequency: 'Twice daily',
      targetMetrics: ['oxygen_saturation'],
    },
    {
      type: 'task',
      priority: 'high',
      title: 'Breathing Exercises',
      description: 'Guide patient through pursed-lip breathing exercises',
      rationale: 'Improves respiratory function',
      frequency: 'Three times daily',
    },
  ],
};

@Injectable()
export class RecommendationEngine {
  /**
   * Generate care recommendations for a patient
   */
  generateRecommendations(context: PatientContext): CareRecommendation[] {
    const recommendations: CareRecommendation[] = [];

    // Condition-based recommendations
    for (const condition of context.conditions) {
      const conditionLower = condition.toLowerCase();
      for (const [key, recs] of Object.entries(CONDITION_RECOMMENDATIONS)) {
        if (conditionLower.includes(key)) {
          recommendations.push(...recs);
        }
      }
    }

    // Age-based recommendations
    if (context.age >= 65) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        title: 'Fall Prevention',
        description: 'Assess fall risk and implement prevention strategies',
        rationale: 'Elderly patients have increased fall risk',
        frequency: 'Each visit',
      });
    }

    // Care level based recommendations
    if (context.careLevel === 'high' || context.careLevel === 'critical') {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        title: 'Comprehensive Vital Signs',
        description: 'Monitor all vital signs each visit',
        rationale: 'High acuity requires close monitoring',
        frequency: 'Each visit',
        targetMetrics: ['blood_pressure_systolic', 'heart_rate', 'temperature', 'oxygen_saturation'],
      });
    }

    // Recent incident based recommendations
    const fallIncidents = context.recentIncidents.filter((i) =>
      i.type.toLowerCase().includes('fall'),
    );
    if (fallIncidents.length >= 2) {
      recommendations.push({
        type: 'intervention',
        priority: 'urgent',
        title: 'Fall Prevention Protocol',
        description: 'Implement enhanced fall prevention measures',
        rationale: `${fallIncidents.length} recent falls indicate high risk`,
      });
    }

    // Medication-based recommendations
    if (context.medications.some((m) => m.toLowerCase().includes('warfarin') || m.toLowerCase().includes('coumadin'))) {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        title: 'Bleeding Risk Assessment',
        description: 'Monitor for signs of bleeding',
        rationale: 'Patient is on anticoagulant therapy',
        frequency: 'Each visit',
      });
    }

    if (context.medications.some((m) => m.toLowerCase().includes('insulin'))) {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        title: 'Hypoglycemia Monitoring',
        description: 'Watch for signs of low blood sugar',
        rationale: 'Insulin therapy carries hypoglycemia risk',
        frequency: 'Each visit',
      });
    }

    // Deduplicate and prioritize
    return this.deduplicateAndPrioritize(recommendations);
  }

  /**
   * Suggest optimal task schedule for a shift
   */
  suggestTaskSchedule(
    context: PatientContext,
    shiftStart: string,
    shiftEnd: string,
  ): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];
    const startHour = parseInt(shiftStart.split(':')[0]);
    const endHour = parseInt(shiftEnd.split(':')[0]);

    // Medication administration (if applicable)
    if (context.medications.length > 0) {
      if (startHour <= 8 && endHour >= 8) {
        suggestions.push({
          taskType: 'Medication Administration',
          suggestedTime: '08:00',
          duration: 15,
          priority: 'high',
          rationale: 'Morning medications with breakfast',
        });
      }
      if (startHour <= 12 && endHour >= 12) {
        suggestions.push({
          taskType: 'Medication Administration',
          suggestedTime: '12:00',
          duration: 15,
          priority: 'high',
          rationale: 'Noon medications with lunch',
        });
      }
      if (startHour <= 18 && endHour >= 18) {
        suggestions.push({
          taskType: 'Medication Administration',
          suggestedTime: '18:00',
          duration: 15,
          priority: 'high',
          rationale: 'Evening medications with dinner',
        });
      }
    }

    // Vital signs
    if (context.careLevel === 'high' || context.careLevel === 'critical') {
      const vitalTimes = ['08:00', '12:00', '16:00', '20:00'];
      for (const time of vitalTimes) {
        const hour = parseInt(time.split(':')[0]);
        if (hour >= startHour && hour <= endHour) {
          suggestions.push({
            taskType: 'Vital Signs Check',
            suggestedTime: time,
            duration: 10,
            priority: 'high',
            rationale: 'Regular monitoring for high-acuity patient',
          });
        }
      }
    }

    // Personal care
    if (startHour <= 9 && endHour >= 9) {
      suggestions.push({
        taskType: 'Personal Care - Morning',
        suggestedTime: '09:00',
        duration: 30,
        priority: 'medium',
        rationale: 'Morning hygiene and dressing',
      });
    }

    // Meal assistance
    if (startHour <= 12 && endHour >= 12) {
      suggestions.push({
        taskType: 'Meal Assistance - Lunch',
        suggestedTime: '12:00',
        duration: 45,
        priority: 'medium',
        rationale: 'Lunch preparation and assistance',
      });
    }

    // Mobility/Exercise
    if (context.conditions.some((c) => c.toLowerCase().includes('fall risk'))) {
      suggestions.push({
        taskType: 'Supervised Mobility Exercise',
        suggestedTime: '14:00',
        duration: 20,
        priority: 'medium',
        rationale: 'Maintain mobility while ensuring safety',
      });
    }

    // Documentation
    suggestions.push({
      taskType: 'Shift Documentation',
      suggestedTime: this.formatTime(endHour - 1),
      duration: 15,
      priority: 'medium',
      rationale: 'Complete shift notes before end of shift',
    });

    return suggestions.sort((a, b) => {
      // Sort by time
      return a.suggestedTime.localeCompare(b.suggestedTime);
    });
  }

  /**
   * Generate care gap alerts
   */
  identifyCareGaps(
    context: PatientContext,
    recentCare: { type: string; date: Date }[],
  ): { gap: string; priority: 'low' | 'medium' | 'high'; daysSince: number }[] {
    const gaps: { gap: string; priority: 'low' | 'medium' | 'high'; daysSince: number }[] = [];
    const now = Date.now();

    // Check for vital signs monitoring gaps
    const lastVitals = context.recentVitals.length > 0
      ? Math.max(...context.recentVitals.map((v) => v.date.getTime()))
      : 0;
    const daysSinceVitals = Math.floor((now - lastVitals) / (1000 * 60 * 60 * 24));

    if (context.careLevel === 'critical' && daysSinceVitals > 1) {
      gaps.push({
        gap: 'Vital signs not recorded recently',
        priority: 'high',
        daysSince: daysSinceVitals,
      });
    } else if (daysSinceVitals > 7) {
      gaps.push({
        gap: 'Vital signs not recorded in over a week',
        priority: 'medium',
        daysSince: daysSinceVitals,
      });
    }

    // Check for care type specific gaps
    const careTypes = ['personal_care', 'medication_review', 'assessment', 'exercise'];
    for (const type of careTypes) {
      const lastCare = recentCare.find((c) => c.type.toLowerCase().includes(type));
      if (!lastCare) {
        gaps.push({
          gap: `No ${type.replace('_', ' ')} recorded`,
          priority: 'medium',
          daysSince: 30,
        });
      } else {
        const daysSince = Math.floor((now - lastCare.date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 7) {
          gaps.push({
            gap: `${type.replace('_', ' ')} not provided recently`,
            priority: 'low',
            daysSince,
          });
        }
      }
    }

    return gaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private deduplicateAndPrioritize(recommendations: CareRecommendation[]): CareRecommendation[] {
    const uniqueMap = new Map<string, CareRecommendation>();

    for (const rec of recommendations) {
      const key = rec.title.toLowerCase();
      const existing = uniqueMap.get(key);

      if (!existing) {
        uniqueMap.set(key, rec);
      } else {
        // Keep higher priority version
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[rec.priority] < priorityOrder[existing.priority]) {
          uniqueMap.set(key, rec);
        }
      }
    }

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private formatTime(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
