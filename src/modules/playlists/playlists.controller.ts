import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Playlist, Prisma } from '@prisma/client';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  findAll(@CurrentUser() user?: any) {
    return this.playlistsService.findAll(user?.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyPlaylists(@CurrentUser() user: any) {
    return this.playlistsService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.playlistsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body() createPlaylistDto: Prisma.PlaylistCreateInput,
  ) {
    return this.playlistsService.create(user.id, createPlaylistDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePlaylistDto: Prisma.PlaylistUpdateInput,
  ) {
    return this.playlistsService.update(id, user.id, updatePlaylistDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.playlistsService.remove(id, user.id);
  }

  @Post(':id/songs/:songId')
  @UseGuards(JwtAuthGuard)
  addSong(
    @Param('id') playlistId: string,
    @Param('songId') songId: string,
    @CurrentUser() user: any,
  ) {
    return this.playlistsService.addSong(playlistId, songId, user.id);
  }

  @Delete(':id/songs/:songId')
  @UseGuards(JwtAuthGuard)
  removeSong(
    @Param('id') playlistId: string,
    @Param('songId') songId: string,
    @CurrentUser() user: any,
  ) {
    return this.playlistsService.removeSong(playlistId, songId, user.id);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard)
  reorderSongs(
    @Param('id') playlistId: string,
    @Body() songOrders: { songId: string; order: number }[],
    @CurrentUser() user: any,
  ) {
    return this.playlistsService.reorderSongs(playlistId, songOrders, user.id);
  }

  @Post(':id/spotify-tracks/:spotifyTrackId')
  @UseGuards(JwtAuthGuard)
  addSpotifyTrack(
    @Param('id') playlistId: string,
    @Param('spotifyTrackId') spotifyTrackId: string,
    @CurrentUser() user: any,
  ) {
    return this.playlistsService.addSpotifyTrackToPlaylist(
      playlistId,
      spotifyTrackId,
      user.id,
    );
  }
}
