import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { Playlist, Prisma } from '@prisma/client';

@Injectable()
export class PlaylistsService {
  constructor(
    private prisma: PrismaService,
    private spotifyService: SpotifyService,
  ) {}

  async findAll(userId?: string): Promise<Playlist[]> {
    const where: Prisma.PlaylistWhereInput = { isActive: true };

    if (userId) {
      where.OR = [{ userId }, { isPublic: true }];
    } else {
      where.isPublic = true;
    }

    return this.prisma.playlist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        playlistSongs: {
          include: {
            song: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Playlist | null> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        playlistSongs: {
          include: {
            song: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return null;
    }

    // Check if user can access this playlist
    if (!playlist.isPublic && playlist.userId !== userId) {
      throw new ForbiddenException('You do not have access to this playlist');
    }

    return playlist;
  }

  async findByUser(userId: string): Promise<Playlist[]> {
    return this.prisma.playlist.findMany({
      where: { userId, isActive: true },
      include: {
        playlistSongs: {
          include: {
            song: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    playlistData: Prisma.PlaylistCreateInput,
  ): Promise<Playlist> {
    return this.prisma.playlist.create({
      data: {
        ...playlistData,
        user: { connect: { id: userId } },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        playlistSongs: {
          include: {
            song: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(
    id: string,
    userId: string,
    playlistData: Prisma.PlaylistUpdateInput,
  ): Promise<Playlist | null> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only update your own playlists');
    }

    await this.prisma.playlist.update({
      where: { id },
      data: playlistData,
    });

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.prisma.playlist.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addSong(
    playlistId: string,
    songId: string,
    userId: string,
  ): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException(
        'You can only add songs to your own playlists',
      );
    }

    const song = await this.prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException('Song not found');
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
      throw new ForbiddenException('Song is already in this playlist');
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

  async removeSong(
    playlistId: string,
    songId: string,
    userId: string,
  ): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException(
        'You can only remove songs from your own playlists',
      );
    }

    await this.prisma.playlistSong.deleteMany({
      where: {
        playlistId,
        songId,
      },
    });
  }

  async reorderSongs(
    playlistId: string,
    songOrders: { songId: string; order: number }[],
    userId: string,
  ): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException(
        'You can only reorder songs in your own playlists',
      );
    }

    // Update all song orders
    for (const { songId, order } of songOrders) {
      await this.prisma.playlistSong.updateMany({
        where: {
          playlistId,
          songId,
        },
        data: { order },
      });
    }
  }

  async addSpotifyTrackToPlaylist(
    playlistId: string,
    spotifyTrackId: string,
    userId: string,
  ): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException(
        'You can only add songs to your own playlists',
      );
    }

    // Get track from Spotify
    const spotifyTrack = await this.spotifyService.getTrackById(spotifyTrackId);

    // Check if track already exists in our database
    let song = await this.prisma.song.findUnique({
      where: { spotifyId: spotifyTrack.id },
    });

    // If not, create it
    if (!song) {
      const songData: Prisma.SongCreateInput = {
        spotifyId: spotifyTrack.id,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists.map((artist) => artist.name).join(', '),
        album: spotifyTrack.album.name,
        duration: Math.floor(spotifyTrack.duration_ms / 1000),
        releaseDate: new Date(spotifyTrack.album.release_date),
        imageUrl: spotifyTrack.album.images[0]?.url,
        previewUrl: spotifyTrack.preview_url,
        spotifyUrl: spotifyTrack.external_urls.spotify,
        popularity: spotifyTrack.popularity,
      };

      song = await this.prisma.song.create({
        data: songData,
      });
    }

    // Check if song is already in playlist
    const existingPlaylistSong = await this.prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId,
          songId: song.id,
        },
      },
    });

    if (existingPlaylistSong) {
      throw new ForbiddenException('Song is already in this playlist');
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
        songId: song.id,
        order: nextOrder,
      },
    });
  }
}
