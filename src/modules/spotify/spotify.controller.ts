import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('search')
  async searchTracks(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.searchTracks(query, limitNum);
  }

  @Get('search/kpop')
  async searchKPopTracks(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.searchKPopTracks(query, limitNum);
  }

  @Get('popular/kpop')
  async getPopularKPopTracks(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.getPopularKPopTracks(limitNum);
  }

  @Get('track/:id')
  async getTrack(@Query('id') trackId: string) {
    return this.spotifyService.getTrackById(trackId);
  }

  @Get('artists/search')
  async searchArtists(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.spotifyService.searchArtists(query, limitNum);
  }

  @Get('artists/:id/top-tracks')
  async getArtistTopTracks(
    @Query('id') artistId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.spotifyService.getArtistTopTracks(artistId, limitNum);
  }
}
