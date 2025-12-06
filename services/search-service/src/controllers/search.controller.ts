import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

class IndexDto {
  @IsString()
  index!: string;

  @IsString()
  id!: string;

  @IsObject()
  document!: Record<string, any>;
}

class SearchQueryDto {
  @IsString()
  index!: string;

  @IsString()
  q!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

@Controller()
export class SearchController {
  private readonly store = new Map<string, Map<string, any>>();

  @Post('index')
  @HttpCode(HttpStatus.OK)
  index(@Body() dto: IndexDto) {
    const idx = this.ensureIndex(dto.index);
    idx.set(dto.id, dto.document);
    return { status: 'indexed' };
  }

  @Get()
  search(
    @Query() q: SearchQueryDto,
  ) {
    const idx = this.store.get(q.index) || new Map<string, any>();
    const items = Array.from(idx.values()).filter((doc) => JSON.stringify(doc).toLowerCase().includes((q.q || '').toLowerCase()));
    const start = Number(q.offset || 0);
    const end = start + Number(q.limit || 25);
    return { items: items.slice(start, end), total: items.length };
  }

  private ensureIndex(name: string) {
    if (!this.store.has(name)) this.store.set(name, new Map());
    return this.store.get(name)!;
  }
}


