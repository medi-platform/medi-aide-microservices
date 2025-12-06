import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '../entities/prediction.entity';

@Injectable()
export class AIService {
  constructor(
    @InjectRepository(Prediction) 
    private readonly predictionRepo: Repository<Prediction>
  ) {}

  async predictCaregiverMatch(data: any) {
    // Mock ML prediction
    const score = Math.random() * 100;
    const prediction = {
      matchScore: score,
      confidence: 0.85,
      factors: {
        skillMatch: Math.random() * 100,
        locationProximity: Math.random() * 100,
        availability: Math.random() * 100,
        patientPreference: Math.random() * 100
      }
    };

    await this.savePrediction('caregiver_match', data, prediction);
    return prediction;
  }

  async predictHealthRisk(data: any) {
    const riskScore = Math.random() * 100;
    const prediction = {
      riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      score: riskScore,
      factors: {
        vitalSigns: Math.random() * 100,
        medicalHistory: Math.random() * 100,
        lifestyle: Math.random() * 100
      }
    };

    await this.savePrediction('health_risk', data, prediction);
    return prediction;
  }

  async predictChurn(data: any) {
    const churnProbability = Math.random();
    const prediction = {
      churnProbability,
      retentionScore: (1 - churnProbability) * 100,
      riskFactors: ['low_engagement', 'payment_delays', 'service_complaints']
    };

    await this.savePrediction('churn', data, prediction);
    return prediction;
  }

  private async savePrediction(modelType: string, input: any, output: any) {
    const prediction = this.predictionRepo.create({
      modelType,
      input,
      output,
      confidence: output.confidence || 0.75
    });
    return this.predictionRepo.save(prediction);
  }
}
