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
      // Try multiple search strategies for better K-pop results
      const searchQueries = [
        `genre:k-pop ${query}`,
        `genre:kpop ${query}`,
        `genre:korean ${query}`,
        `${query} k-pop`,
        `${query} kpop`,
        `${query} korean pop`,
        query, // Fallback to regular search
      ];

      for (const searchQuery of searchQueries) {
        try {
          const response = await this.spotifyApi.searchTracks(searchQuery, {
            limit,
            market: 'US',
          });

          const tracks = response.body.tracks?.items || [];
          if (tracks.length > 0) {
            this.logger.log(
              `Found ${tracks.length} tracks with query: ${searchQuery}`,
            );
            return tracks;
          }
        } catch (searchError) {
          this.logger.warn(
            `Search failed for query: ${searchQuery}`,
            searchError,
          );
          continue;
        }
      }

      // If no results found with any query, return empty array
      this.logger.warn(`No K-pop tracks found for query: ${query}`);
      return [];
    } catch (error) {
      this.logger.error('Spotify K-pop search failed:', error);
      throw new Error('Failed to search K-pop tracks');
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
      // Try multiple search strategies for popular K-pop tracks
      const searchQueries = [
        'genre:k-pop',
        'genre:kpop',
        'genre:korean',
        'k-pop',
        'kpop',
        'korean pop',
        'BTS', // Popular K-pop artists as fallback
        'BLACKPINK',
        'NewJeans',
        'aespa',
      ];

      let allTracks: SpotifyTrack[] = [];

      for (const searchQuery of searchQueries) {
        try {
          const response = await this.spotifyApi.searchTracks(searchQuery, {
            limit: Math.ceil(limit / searchQueries.length) + 5, // Get more to account for duplicates
            market: 'US',
          });

          const tracks = response.body.tracks?.items || [];
          allTracks = allTracks.concat(tracks);
        } catch (searchError) {
          this.logger.warn(
            `Search failed for popular query: ${searchQuery}`,
            searchError,
          );
          continue;
        }
      }

      // Remove duplicates and sort by popularity
      const uniqueTracks = allTracks.filter(
        (track, index, self) =>
          index === self.findIndex((t) => t.id === track.id),
      );

      return uniqueTracks
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
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

  async getRecentKPopReleases(limit: number = 3): Promise<SpotifyTrack[]> {
    await this.authenticate();

    try {
      // Search for recent K-pop releases by looking for tracks from the last few months
      const currentDate = new Date();
      const threeMonthsAgo = new Date(
        currentDate.getTime() - 90 * 24 * 60 * 60 * 1000,
      );

      // Try different search strategies for recent releases
      const searchQueries = [
        'genre:k-pop year:2024',
        'genre:kpop year:2024',
        'genre:korean year:2024',
        'k-pop 2024',
        'kpop 2024',
        'korean pop 2024',
        // Popular K-pop artists with recent releases
        'BTS year:2024',
        'BLACKPINK year:2024',
        'NewJeans year:2024',
        'aespa year:2024',
        'LE SSERAFIM year:2024',
        'ITZY year:2024',
        'Stray Kids year:2024',
        'TWICE year:2024',
      ];

      let allTracks: SpotifyTrack[] = [];

      for (const searchQuery of searchQueries) {
        try {
          const response = await this.spotifyApi.searchTracks(searchQuery, {
            limit: Math.ceil(limit * 2), // Get more to account for filtering
            market: 'US',
          });

          const tracks = response.body.tracks?.items || [];
          allTracks = allTracks.concat(tracks);
        } catch (searchError) {
          this.logger.warn(
            `Search failed for recent releases query: ${searchQuery}`,
            searchError,
          );
          continue;
        }
      }

      // Remove duplicates and filter by release date
      const uniqueTracks = allTracks.filter(
        (track, index, self) =>
          index === self.findIndex((t) => t.id === track.id),
      );

      // Filter tracks released in the last 6 months and sort by release date
      const recentTracks = uniqueTracks
        .filter((track) => {
          const releaseDate = new Date(track.album.release_date);
          return releaseDate >= threeMonthsAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.album.release_date);
          const dateB = new Date(b.album.release_date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        })
        .slice(0, limit);

      // If we don't have enough recent tracks, fall back to popular K-pop tracks
      if (recentTracks.length < limit) {
        const popularTracks = await this.getPopularKPopTracks(limit);
        const additionalTracks = popularTracks.slice(
          0,
          limit - recentTracks.length,
        );
        return [...recentTracks, ...additionalTracks].slice(0, limit);
      }

      return recentTracks;
    } catch (error) {
      this.logger.error('Failed to get recent K-pop releases:', error);
      // Fallback to popular tracks if recent search fails
      return this.getPopularKPopTracks(limit);
    }
  }
}
