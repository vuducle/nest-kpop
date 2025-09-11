import { Injectable, Logger } from '@nestjs/common';
import SpotifyWebApi from 'spotify-web-api-node';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height?: number; width?: number }[];
    release_date: string;
  };
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
  popularity: number;
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private spotifyApi: SpotifyWebApi;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  private async authenticate(): Promise<void> {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
      this.logger.log('Spotify authentication successful');
    } catch (error) {
      this.logger.error('Spotify authentication failed:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async searchKPopTracks(
    query: string,
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    await this.authenticate();

    try {
      const searchQuery = `genre:k-pop ${query}`;
      const response = await this.spotifyApi.searchTracks(searchQuery, {
        limit,
        market: 'US',
      });

      return response.body.tracks?.items || [];
    } catch (error) {
      this.logger.error('Spotify search failed:', error);
      throw new Error('Failed to search Spotify tracks');
    }
  }

  async searchTracks(
    query: string,
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    await this.authenticate();

    try {
      const response = await this.spotifyApi.searchTracks(query, {
        limit,
        market: 'US',
      });

      return response.body.tracks?.items || [];
    } catch (error) {
      this.logger.error('Spotify search failed:', error);
      throw new Error('Failed to search Spotify tracks');
    }
  }

  async getTrackById(trackId: string): Promise<SpotifyTrack> {
    await this.authenticate();

    try {
      const response = await this.spotifyApi.getTrack(trackId);
      return response.body;
    } catch (error) {
      this.logger.error('Failed to get track by ID:', error);
      throw new Error('Failed to get track from Spotify');
    }
  }

  async getPopularKPopTracks(limit: number = 20): Promise<SpotifyTrack[]> {
    await this.authenticate();

    try {
      // Search for popular K-pop tracks
      const response = await this.spotifyApi.searchTracks('genre:k-pop', {
        limit,
        market: 'US',
      });

      // Sort by popularity
      return (
        response.body.tracks?.items.sort(
          (a, b) => b.popularity - a.popularity,
        ) || []
      );
    } catch (error) {
      this.logger.error('Failed to get popular K-pop tracks:', error);
      throw new Error('Failed to get popular K-pop tracks from Spotify');
    }
  }

  async getArtistTopTracks(
    artistId: string,
    limit: number = 10,
  ): Promise<SpotifyTrack[]> {
    await this.authenticate();

    try {
      const response = await this.spotifyApi.getArtistTopTracks(artistId, 'US');
      return response.body.tracks?.slice(0, limit) || [];
    } catch (error) {
      this.logger.error('Failed to get artist top tracks:', error);
      throw new Error('Failed to get artist top tracks from Spotify');
    }
  }

  async searchArtists(query: string, limit: number = 10): Promise<any[]> {
    await this.authenticate();

    try {
      const response = await this.spotifyApi.searchArtists(query, {
        limit,
        market: 'US',
      });

      return response.body.artists?.items || [];
    } catch (error) {
      this.logger.error('Failed to search artists:', error);
      throw new Error('Failed to search artists on Spotify');
    }
  }
}
