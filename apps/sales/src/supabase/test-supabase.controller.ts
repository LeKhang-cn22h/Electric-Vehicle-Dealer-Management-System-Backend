import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './test-supabase.service';

@Controller('supabase')
export class TestSupabaseController {
  constructor(private readonly testService: SupabaseService) {}

  @Get('test')
  async test() {
    return this.testService.testConnection();
  }
}
