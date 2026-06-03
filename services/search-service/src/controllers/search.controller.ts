import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { SearchIndex, SearchQuery, SortOrder } from '../interfaces/search.interface';

class SearchDto {
  query!: string;
  index!: SearchIndex;
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  sort?: Array<{ field: string; order: SortOrder }>;
  page?: number;
  pageSize?: number;
  highlight?: boolean;
  fuzzy?: boolean;
}

class SaveSearchDto {
  name!: string;
  description?: string;
  query!: string;
  index!: SearchIndex;
  filters?: Record<string, unknown>;
  sort?: Record<string, unknown>;
  sendNotifications?: boolean;
  notificationFrequency?: 'instant' | 'daily' | 'weekly';
}

@Controller('search')
@ApiTags('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Body() dto: SearchDto,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.searchService.search(dto as SearchQuery, userId, sessionId);
  }

  @Get('caregivers')
  @ApiOperation({ summary: 'Search caregivers' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async searchCaregivers(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('userId') userId?: string,
  ) {
    return this.searchService.searchCaregivers(query, undefined, page, pageSize, userId);
  }

  @Get('autocomplete/:index')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'prefix', required: true })
  @ApiQuery({ name: 'field', required: false })
  async autocomplete(
    @Param('index') index: SearchIndex,
    @Query('prefix') prefix: string,
    @Query('field') field?: string,
  ) {
    return this.searchService.autocomplete(index, prefix, field);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiQuery({ name: 'index', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPopularSearches(
    @Query('index') index?: SearchIndex,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getPopularSearches(index, limit);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user search history' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async getSearchHistory(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getSearchHistory(userId, limit);
  }

  @Post('saved')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a search' })
  async saveSearch(
    @Body() dto: SaveSearchDto,
    @Query('userId') userId: string,
  ) {
    const query: SearchQuery = {
      query: dto.query,
      index: dto.index,
      filters: dto.filters as SearchQuery['filters'],
      sort: dto.sort as SearchQuery['sort'],
    };
    return this.searchService.saveSearch(
      userId,
      dto.name,
      query,
      dto.description,
      dto.sendNotifications,
      dto.notificationFrequency,
    );
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get user saved searches' })
  @ApiQuery({ name: 'userId', required: true })
  async getSavedSearches(@Query('userId') userId: string) {
    return this.searchService.getSavedSearches(userId);
  }

  @Post('saved/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a saved search' })
  async executeSavedSearch(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
  ) {
    return this.searchService.executeSavedSearch(id, userId);
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved search' })
  async deleteSavedSearch(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
  ) {
    await this.searchService.deleteSavedSearch(id, userId);
  }
}
