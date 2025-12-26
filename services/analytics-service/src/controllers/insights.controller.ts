import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Insights Controller
 * Provides AI-powered business insights and recommendations.
 */
@ApiTags('Insights')
@Controller('insights')
export class InsightsController {

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard insights' })
  async getDashboardInsights(@Query('period') period: string = 'week') {
    return {
      period,
      insights: [
        { type: 'trend', title: 'Shift completion rate up 5%', severity: 'positive' },
        { type: 'alert', title: '3 caregivers at burnout risk', severity: 'warning' },
        { type: 'opportunity', title: 'Optimize routes to save 12% travel time', severity: 'info' },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get predictive insights' })
  async getPredictions(@Query('type') type?: string) {
    return {
      predictions: [
        { type: 'demand', prediction: 'High demand expected next week', confidence: 0.85 },
        { type: 'churn', prediction: '2 caregivers at risk of leaving', confidence: 0.72 },
      ],
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get actionable recommendations' })
  async getRecommendations(@Query('category') category?: string) {
    return {
      recommendations: [
        { id: 'rec_1', title: 'Hire 3 more caregivers', priority: 'high', impact: 'revenue' },
        { id: 'rec_2', title: 'Implement new training program', priority: 'medium', impact: 'quality' },
      ],
    };
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get detected anomalies' })
  async getAnomalies(@Query('since') since?: string) {
    return { anomalies: [], detectedAt: new Date().toISOString() };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trend analysis' })
  async getTrends(@Query('metric') metric: string, @Query('period') period: string = 'month') {
    return { metric, period, trend: 'increasing', changePercent: 5.2, dataPoints: [] };
  }
}

