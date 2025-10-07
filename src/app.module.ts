import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SongsModule } from './modules/songs/songs.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    SongsModule,
    PlaylistsModule,
    SpotifyModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
