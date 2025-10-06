import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { User, Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const currentUserId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.searchUsers(currentUserId, query, limitNum);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body()
    updateProfileDto: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phoneNumber?: string;
    },
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Patch(':username')
  update(
    @Param('username') username: string,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update(username, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfileImage(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/profile-images/${file.filename}`;

    return this.usersService.updateProfile(userId, { profileImage: imageUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('test')
  test() {
    return 'Hello World!';
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-friends')
  async testFriends(@Request() req: any) {
    const userId = req.user.id;
    console.log('testFriends called with userId:', userId);

    // Return a simple string to test if the response serialization works
    return 'Hello from test-friends!';
  }

  // Friendship endpoints
  // Note: More specific routes must come before more general routes
  @UseGuards(JwtAuthGuard)
  @Get('friends/recommendations')
  async getFriendRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.getFriendRecommendations(userId, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/status/:targetUserId')
  async getFriendStatus(
    @Request() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    const userId = req.user.id;
    return this.usersService.getFriendStatus(userId, targetUserId);
  }

  @Get('my-friends')
  getFriends() {
    console.log('=== SIMPLE getFriends called ===');
    return [{ id: '1', name: 'Test Friend' }];
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/:friendId')
  async addFriend(@Request() req: any, @Param('friendId') friendId: string) {
    const userId = req.user.id;
    return this.usersService.addFriend(userId, friendId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('friends/:friendId')
  async removeFriend(@Request() req: any, @Param('friendId') friendId: string) {
    const userId = req.user.id;
    return this.usersService.removeFriend(userId, friendId);
  }
}
