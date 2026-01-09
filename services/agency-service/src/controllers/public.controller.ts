import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Public API Controller
 * 
 * Handles public-facing endpoints that don't require authentication.
 * These are typically used for:
 * - Public job listings
 * - Referral submissions
 * - Launch/landing page data
 * - WebSocket connection info
 */
@ApiTags('Public')
@Controller('public')
export class PublicController {
  @Get()
  @ApiOperation({ summary: 'Public API root' })
  @ApiResponse({ status: 200, description: 'Public API information' })
  getRoot() {
    return {
      name: 'Medi-Aide Public API',
      version: '1.0.0',
      endpoints: {
        contracts: '/api/v1/public/contracts',
        referrals: '/api/v1/public/referrals',
        launch: '/api/v1/public/launch',
        ws: '/api/v1/public/ws',
      },
    };
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get public contract information' })
  @ApiResponse({ status: 200, description: 'Public contract details' })
  getContracts(@Query('type') type?: string) {
    return {
      contracts: [
        {
          id: 'standard',
          name: 'Standard Care Agreement',
          description: 'Basic care service agreement',
          terms: 'https://medi-aide.com/terms/standard',
        },
        {
          id: 'enterprise',
          name: 'Enterprise Care Agreement',
          description: 'Enterprise-level care service agreement',
          terms: 'https://medi-aide.com/terms/enterprise',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Get referral program info' })
  @ApiResponse({ status: 200, description: 'Referral program details' })
  getReferralInfo() {
    return {
      program: {
        name: 'Medi-Aide Referral Program',
        reward: {
          referrer: 100,
          referee: 50,
          currency: 'CAD',
        },
        terms: 'https://medi-aide.com/referrals/terms',
      },
      active: true,
    };
  }

  @Post('referrals')
  @ApiOperation({ summary: 'Submit a referral' })
  @ApiResponse({ status: 201, description: 'Referral submitted successfully' })
  submitReferral(@Body() body: {
    referrerEmail: string;
    refereeEmail: string;
    refereeName: string;
    refereePhone?: string;
    message?: string;
  }) {
    return {
      success: true,
      referralId: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: 'Referral submitted successfully. The referee will receive an invitation.',
      submittedAt: new Date().toISOString(),
    };
  }

  @Get('launch')
  @ApiOperation({ summary: 'Get launch/landing page data' })
  @ApiResponse({ status: 200, description: 'Launch page configuration' })
  getLaunchData() {
    return {
      hero: {
        title: 'Quality Care, Connected',
        subtitle: 'Medi-Aide connects caregivers with those who need care',
        ctaText: 'Get Started',
        ctaUrl: '/register',
      },
      features: [
        {
          icon: 'users',
          title: 'Verified Caregivers',
          description: 'All caregivers are background-checked and verified',
        },
        {
          icon: 'clock',
          title: '24/7 Availability',
          description: 'Find care when you need it, any time of day',
        },
        {
          icon: 'shield',
          title: 'HIPAA Compliant',
          description: 'Your health information is protected',
        },
      ],
      stats: {
        caregivers: 5000,
        patients: 10000,
        visits: 500000,
        rating: 4.8,
      },
      testimonials: [],
    };
  }

  @Get('ws')
  @ApiOperation({ summary: 'Get WebSocket connection info' })
  @ApiResponse({ status: 200, description: 'WebSocket configuration' })
  getWebSocketInfo() {
    return {
      url: process.env.WS_URL || 'wss://api.medi-aide.com/ws',
      protocols: ['v1'],
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
    };
  }
}

/**
 * Support Controller
 * 
 * Handles support and help center endpoints.
 */
@ApiTags('Support')
@Controller('support')
export class SupportController {
  @Get()
  @ApiOperation({ summary: 'Get support options' })
  getSupport() {
    return {
      options: {
        phone: '1-800-MEDI-AID',
        email: 'support@medi-aide.com',
        chat: true,
        hours: '24/7',
      },
      articles: [],
    };
  }

  @Get('help-center')
  @ApiOperation({ summary: 'Get help center articles' })
  getHelpCenter(@Query('category') category?: string, @Query('search') search?: string) {
    return {
      categories: [
        { id: 'getting-started', name: 'Getting Started', articleCount: 10 },
        { id: 'caregivers', name: 'For Caregivers', articleCount: 25 },
        { id: 'agencies', name: 'For Agencies', articleCount: 15 },
        { id: 'billing', name: 'Billing & Payments', articleCount: 12 },
        { id: 'security', name: 'Security & Privacy', articleCount: 8 },
      ],
      featuredArticles: [
        { id: '1', title: 'How to Create Your First Care Request', category: 'getting-started' },
        { id: '2', title: 'Understanding EVV Requirements', category: 'caregivers' },
        { id: '3', title: 'Setting Up Your Agency Profile', category: 'agencies' },
      ],
      searchResults: search ? [] : undefined,
    };
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  createTicket(@Body() body: {
    subject: string;
    description: string;
    category: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    email: string;
  }) {
    return {
      success: true,
      ticketId: `TKT-${Date.now().toString(36).toUpperCase()}`,
      message: 'Support ticket created. You will receive a confirmation email shortly.',
      estimatedResponse: '24 hours',
    };
  }
}

/**
 * Timesheets Controller
 * 
 * Handles timesheet management for agencies.
 */
@ApiTags('Timesheets')
@Controller('timesheets')
export class TimesheetsController {
  @Get()
  @ApiOperation({ summary: 'List timesheets' })
  getTimesheets(
    @Query('agencyId') agencyId?: string,
    @Query('caregiverId') caregiverId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return {
      timesheets: [],
      total: 0,
      filters: { agencyId, caregiverId, startDate, endDate, status },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get timesheet by ID' })
  getTimesheet() {
    return {
      id: '',
      caregiver: {},
      period: {},
      entries: [],
      totalHours: 0,
      status: 'pending',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create timesheet' })
  createTimesheet(@Body() body: any) {
    return {
      success: true,
      timesheet: { id: `ts_${Date.now()}`, ...body },
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve timesheet' })
  approveTimesheet() {
    return {
      success: true,
      status: 'approved',
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject timesheet' })
  rejectTimesheet(@Body() body: { reason: string }) {
    return {
      success: true,
      status: 'rejected',
      reason: body.reason,
    };
  }
}
