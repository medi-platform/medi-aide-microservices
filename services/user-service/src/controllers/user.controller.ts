import { Controller, Get } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get()
  list() {
    return this.users.list();
  }
}
