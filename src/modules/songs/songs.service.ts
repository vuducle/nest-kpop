import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotifyService, SpotifyTrack } from '../spotify/spotify.service';
import { Song, Prisma } from '@prisma/client';

@Injectable()
export class SongsService {
  constructor(
    private prisma: PrismaService,
    private spotifyService: SpotifyService,
  ) {}

  async findAll(): Promise<Song[]> {
    return this.prisma.song.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Song | null> {
    return this.prisma.song.findUnique({
      where: { id, isActive: true },
    });
  }

  async findByArtist(artist: string): Promise<Song[]> {
    return this.prisma.song.findMany({
      where: {
        artist: { contains: artist, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { releaseDate: 'desc' },
    });
  }

  async findByGenre(genre: string): Promise<Song[]> {
    return this.prisma.song.findMany({
      where: {
        genre: { contains: genre, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { releaseDate: 'desc' },
    });
  }

  async search(query: string): Promise<Song[]> {
    return this.prisma.song.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { artist: { contains: query, mode: 'insensitive' } },
              { album: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { releaseDate: 'desc' },
    });
  }

  async create(songData: Prisma.SongCreateInput): Promise<Song> {
    return this.prisma.song.create({
      data: songData,
    });
  }

  async update(
    id: string,
    songData: Prisma.SongUpdateInput,
  ): Promise<Song | null> {
    await this.prisma.song.update({
      where: { id },
      data: songData,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.song.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Spotify integration methods
  async searchSpotifyTracks(
    query: string,
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    return this.spotifyService.searchTracks(query, limit);
  }

  async searchSpotifyKPopTracks(
    query: string,
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    return this.spotifyService.searchKPopTracks(query, limit);
  }

  async getPopularSpotifyKPopTracks(
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    return this.spotifyService.getPopularKPopTracks(limit);
  }

  async getSpotifyTrackById(trackId: string): Promise<SpotifyTrack> {
    return this.spotifyService.getTrackById(trackId);
  }

  async saveSpotifyTrack(spotifyTrack: SpotifyTrack): Promise<Song> {
    // Check if track already exists
    const existingSong = await this.prisma.song.findUnique({
      where: { spotifyId: spotifyTrack.id },
    });

    if (existingSong) {
      return existingSong;
    }

    // Convert Spotify track to our Song format
    const songData: Prisma.SongCreateInput = {
      spotifyId: spotifyTrack.id,
      title: spotifyTrack.name,
      artist: spotifyTrack.artists.map((artist) => artist.name).join(', '),
      album: spotifyTrack.album.name,
      duration: Math.floor(spotifyTrack.duration_ms / 1000), // Convert to seconds
      releaseDate: new Date(spotifyTrack.album.release_date),
      imageUrl: spotifyTrack.album.images[0]?.url,
      previewUrl: spotifyTrack.preview_url,
      spotifyUrl: spotifyTrack.external_urls.spotify,
      popularity: spotifyTrack.popularity,
    };

    return this.prisma.song.create({
      data: songData,
    });
  }

  async addSpotifyTrackToPlaylist(
    playlistId: string,
    spotifyTrackId: string,
    userId: string,
  ): Promise<void> {
    // First, save the Spotify track to our database
    const spotifyTrack = await this.spotifyService.getTrackById(spotifyTrackId);
    const song = await this.saveSpotifyTrack(spotifyTrack);

    // Then add it to the playlist using existing logic
    // We'll need to import the playlists service or create a method here
    // For now, let's create a simple method
    await this.addSongToPlaylist(playlistId, song.id, userId);
  }

  private async addSongToPlaylist(
    playlistId: string,
    songId: string,
    userId: string,
  ): Promise<void> {
    // Check if playlist exists and user owns it
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new Error('You can only add songs to your own playlists');
    }

    // Check if song is already in playlist
    const existingPlaylistSong = await this.prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId,
          songId,
        },
      },
    });

    if (existingPlaylistSong) {
      throw new Error('Song is already in this playlist');
    }

    // Get the next order number
    const lastSong = await this.prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastSong ? lastSong.order + 1 : 1;

    await this.prisma.playlistSong.create({
      data: {
        playlistId,
        songId,
        order: nextOrder,
      },
    });
  }
}
