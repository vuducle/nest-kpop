import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { Song, Prisma } from '@prisma/client';

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  create(@Body() createSongDto: Prisma.SongCreateInput) {
    return this.songsService.create(createSongDto);
  }

  @Get()
  findAll(
    @Query('artist') artist?: string,
    @Query('genre') genre?: string,
    @Query('search') search?: string,
  ) {
    if (search) {
      return this.songsService.search(search);
    }
    if (artist) {
      return this.songsService.findByArtist(artist);
    }
    if (genre) {
      return this.songsService.findByGenre(genre);
    }
    return this.songsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSongDto: Prisma.SongUpdateInput,
  ) {
    return this.songsService.update(id, updateSongDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songsService.remove(id);
  }

  // Spotify integration endpoints
  @Get('spotify/search')
  searchSpotifyTracks(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.songsService.searchSpotifyTracks(query, limitNum);
  }

  @Get('spotify/search/kpop')
  searchSpotifyKPopTracks(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.songsService.searchSpotifyKPopTracks(query, limitNum);
  }

  @Get('spotify/popular/kpop')
  getPopularSpotifyKPopTracks(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.songsService.getPopularSpotifyKPopTracks(limitNum);
  }

  @Get('spotify/track/:id')
  getSpotifyTrack(@Param('id') trackId: string) {
    return this.songsService.getSpotifyTrackById(trackId);
  }
}
