import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MatchingService } from '../services/matching.service';

@Controller('care-requests/:requestId/matching')
@ApiTags('matching')
export class MatchingController {
  constructor(private readonly service: MatchingService) {}

  @Get('candidates') @ApiOperation({ summary: 'Get matching candidates' })
  getCandidates(@Param('requestId', ParseUUIDPipe) requestId: string) { return this.service.getCandidates(requestId); }

  @Post('run') @ApiOperation({ summary: 'Run matching algorithm' })
  runMatching(@Param('requestId', ParseUUIDPipe) requestId: string) { return this.service.runMatching(requestId); }

  @Get('scores') @ApiOperation({ summary: 'Get match scores' })
  getScores(@Param('requestId', ParseUUIDPipe) requestId: string) { return this.service.getScores(requestId); }

  @Post('select') @ApiOperation({ summary: 'Select match' })
  selectMatch(@Param('requestId', ParseUUIDPipe) requestId: string, @Body('caregiverId') caregiverId: string) { return this.service.selectMatch(requestId, caregiverId); }
}


