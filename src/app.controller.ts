import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './modules/users/users.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends')
  async getFriends(@Request() req: any) {
    const userId = req.user.id;
    console.log('=== AppController friends called ===');
    console.log('userId:', userId);

    try {
      const result = await this.usersService.getFriends(userId);
      console.log('getFriends result:', result);
      return result;
    } catch (error) {
      console.error('getFriends error:', error);
      throw error;
    }
  }
}
