import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MatchingEngine } from './matching';
import { PredictionEngine } from './predictions';
import { AnomalyDetector } from './anomaly-detection';
import { RecommendationEngine } from './recommendations';
import { ClinicalNLPService } from './nlp';

export interface AIModuleOptions {
  matching?: boolean;
  predictions?: boolean;
  anomalyDetection?: boolean;
  recommendations?: boolean;
  nlp?: boolean;
}

@Global()
@Module({})
export class AIModule {
  static forRoot(options: AIModuleOptions = {}): DynamicModule {
    const defaultOptions: AIModuleOptions = {
      matching: true,
      predictions: true,
      anomalyDetection: true,
      recommendations: true,
      nlp: true,
      ...options,
    };

    const providers: any[] = [];
    const exports: any[] = [];

    if (defaultOptions.matching) {
      providers.push(MatchingEngine);
      exports.push(MatchingEngine);
    }

    if (defaultOptions.predictions) {
      providers.push(PredictionEngine);
      exports.push(PredictionEngine);
    }

    if (defaultOptions.anomalyDetection) {
      providers.push(AnomalyDetector);
      exports.push(AnomalyDetector);
    }

    if (defaultOptions.recommendations) {
      providers.push(RecommendationEngine);
      exports.push(RecommendationEngine);
    }

    if (defaultOptions.nlp) {
      providers.push(ClinicalNLPService);
      exports.push(ClinicalNLPService);
    }

    return {
      module: AIModule,
      imports: [ConfigModule],
      providers,
      exports,
    };
  }
}
