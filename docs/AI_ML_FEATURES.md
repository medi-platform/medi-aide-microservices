# AI/ML Features Documentation

## Overview

The `@medi-aide/ai-ml` package provides AI and machine learning capabilities for the Medi-Aide healthcare platform, enabling intelligent decision support, predictions, and automated insights.

## Installation

```bash
npm install @medi-aide/ai-ml
```

## Features

### 1. Smart Caregiver-Patient Matching

Intelligent algorithm that matches caregivers to patients based on multiple factors.

#### Usage

```typescript
import { MatchingEngine, CaregiverProfile, PatientProfile } from '@medi-aide/ai-ml';

const engine = new MatchingEngine({
  weights: {
    skills: 0.25,
    language: 0.10,
    distance: 0.15,
    availability: 0.15,
    reliability: 0.15,
    compatibility: 0.10,
    continuity: 0.10,
  },
  thresholds: {
    minimumScore: 0.6,
    maxDistance: 50, // km
  },
});

// Find matches
const matches = engine.findMatches(patient, caregivers, shiftRequirement, 10);

// Each match includes:
// - score: Overall compatibility score (0-1)
// - breakdown: Individual factor scores
// - confidence: 'high' | 'medium' | 'low'
// - warnings: Any concerns about the match
```

#### Matching Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Skills | 25% | Match required skills and certifications |
| Language | 10% | Language compatibility |
| Distance | 15% | Geographic proximity |
| Availability | 15% | Schedule alignment |
| Reliability | 15% | Historical reliability metrics |
| Compatibility | 10% | Care level experience, ratings |
| Continuity | 10% | Bonus for previous patient relationships |

### 2. Shift Prediction & Optimization

Predicts staffing needs and optimizes schedules.

```typescript
import { PredictionEngine } from '@medi-aide/ai-ml';

const predictor = new PredictionEngine();

// Predict demand
const predictions = predictor.predictDemand(
  historicalData,
  startDate,
  endDate
);

// Get staffing recommendations
const recommendations = predictor.getStaffingRecommendations(
  predictions,
  currentSchedule
);

// Predict cancellation risk
const risks = predictor.predictCancellationRisk(
  caregiverHistory,
  upcomingShifts
);
```

#### Features
- **Demand Forecasting**: Predicts patient care demand by hour
- **Staffing Recommendations**: Identifies staffing gaps
- **Cancellation Risk**: Predicts which shifts are at risk
- **Optimal Shift Times**: Recommends efficient shift patterns

### 3. Anomaly Detection

Detects unusual patterns in vitals, incidents, and caregiver behavior.

```typescript
import { AnomalyDetector } from '@medi-aide/ai-ml';

const detector = new AnomalyDetector();

// Detect vital sign anomalies
const vitalAnomalies = detector.detectVitalAnomalies(
  vitalReadings,
  patientBaselines // optional
);

// Detect incident patterns
const patterns = detector.detectIncidentPatterns(incidents);

// Detect caregiver behavior anomalies
const behaviorAnomalies = detector.detectBehaviorAnomalies(caregiverData);
```

#### Vital Sign Thresholds

| Vital | Normal Range | Critical Range |
|-------|--------------|----------------|
| BP Systolic | 90-140 mmHg | <70 or >180 |
| BP Diastolic | 60-90 mmHg | <40 or >120 |
| Heart Rate | 60-100 bpm | <40 or >150 |
| Temperature | 36.1-37.2°C | <35 or >39 |
| SpO2 | 95-100% | <88% |
| Glucose | 70-140 mg/dL | <50 or >300 |

### 4. Care Recommendations Engine

AI-powered care recommendations based on patient context.

```typescript
import { RecommendationEngine, PatientContext } from '@medi-aide/ai-ml';

const engine = new RecommendationEngine();

// Generate recommendations
const recommendations = engine.generateRecommendations(patientContext);

// Suggest optimal task schedule
const taskSchedule = engine.suggestTaskSchedule(
  patientContext,
  '06:00', // shift start
  '14:00'  // shift end
);

// Identify care gaps
const gaps = engine.identifyCareGaps(patientContext, recentCare);
```

#### Supported Conditions
- Diabetes
- Hypertension
- Dementia
- Fall Risk
- COPD
- And more...

### 5. Clinical NLP

Natural language processing for clinical documentation.

```typescript
import { ClinicalNLPService } from '@medi-aide/ai-ml';

const nlp = new ClinicalNLPService();

// Extract entities from clinical note
const entities = nlp.extractEntities(noteText);
// Returns: symptoms, medications, measurements, times, etc.

// Summarize a clinical note
const summary = nlp.summarizeNote(noteId, patientId, text, noteDate);
// Returns: key findings, symptoms, alert triggers, sentiment

// Search clinical notes
const results = nlp.searchNotes(notes, 'chest pain medication');

// Analyze documentation quality
const quality = nlp.analyzeDocumentationQuality(noteText);
// Returns: score, issues, suggestions
```

## NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { AIModule } from '@medi-aide/ai-ml';

@Module({
  imports: [
    AIModule.forRoot({
      matching: true,
      predictions: true,
      anomalyDetection: true,
      recommendations: true,
      nlp: true,
    }),
  ],
})
export class AppModule {}
```

Then inject services:

```typescript
@Injectable()
export class SchedulingService {
  constructor(
    private matching: MatchingEngine,
    private predictions: PredictionEngine,
  ) {}

  async findBestCaregiver(patientId: string, shiftId: string) {
    const patient = await this.getPatient(patientId);
    const caregivers = await this.getAvailableCaregivers();
    return this.matching.findMatches(patient, caregivers, shift);
  }
}
```

## Scoring Utilities

Common scoring functions for AI calculations:

```typescript
import {
  calculateWeightedScore,
  normalize,
  cosineSimilarity,
  jaccardSimilarity,
  calculateRiskScore,
  confidenceInterval,
  timeDecayScore,
} from '@medi-aide/ai-ml';
```

## Best Practices

### 1. Data Quality
- Ensure sufficient historical data for predictions (minimum 14-30 days)
- Validate vital readings before anomaly detection
- Keep patient baselines updated

### 2. Model Tuning
- Adjust matching weights based on agency priorities
- Update thresholds for specific patient populations
- Monitor prediction accuracy and recalibrate

### 3. Alert Management
- Configure alert severity appropriately
- Avoid alert fatigue with appropriate thresholds
- Review and action high-priority alerts promptly

### 4. Privacy Considerations
- All AI processing happens server-side
- No patient data is sent to external ML services
- Audit all AI-assisted decisions

## Performance Considerations

- Matching engine: O(n) where n = number of caregivers
- Predictions: Depends on historical data size
- Anomaly detection: O(n) per reading
- NLP: O(n) where n = text length

For large datasets, consider:
- Batch processing for predictions
- Caching of baselines
- Incremental updates

## API Reference

See inline TypeScript documentation for detailed API reference.
