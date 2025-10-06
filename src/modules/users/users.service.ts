import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@prisma/client';

export interface FriendUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage: string | null;
  createdAt: Date;
  _count: {
    playlists: number;
  };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(userData: Prisma.UserCreateInput): Promise<User> {
    // Check if user already exists
    const existingUserDenisKunz = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUserDenisKunz) {
      if (existingUserDenisKunz.email === userData.email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUserDenisKunz.username === userData.username) {
        throw new ConflictException('User with this username already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
  }

  async update(
    username: string,
    userData: Prisma.UserUpdateInput,
  ): Promise<User | null> {
    // Check if user exists first by username
    const existingUser = await this.findByUsername(username);
    if (!existingUser) {
      console.error('User not found', username);
      throw new Error('User not found');
    }

    const updateData = { ...userData };

    // Hash password if it's being updated
    if (updateData.password && typeof updateData.password === 'string') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update using the user's ID
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
    });

    // Return the updated user by ID
    return this.findOne(existingUser.id);
  }

  async updateProfile(
    id: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImage?: string;
      phoneNumber?: string;
    },
  ): Promise<User | null> {
    try {
      const currentUser = await this.findOne(id);
      if (!currentUser) {
        throw new Error('User not found');
      }

      const updateData: Prisma.UserUpdateInput = { ...profileData };

      // Track username changes
      if (
        profileData.username &&
        profileData.username !== currentUser.username
      ) {
        // Check if new username is already taken
        const existingUser = await this.prisma.user.findUnique({
          where: { username: profileData.username },
        });

        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Username already taken');
        }

        updateData.usernameChangeCount =
          (currentUser.usernameChangeCount || 0) + 1;
      }

      await this.prisma.user.updateMany({
        where: { id },
        data: updateData,
      });

      return this.findOne(id);
    } catch (error) {
      console.error('updateProfile error:', error);
      throw error;
    }
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  // Friendship methods
  async addFriend(userId: string, friendId: string): Promise<User | null> {
    // Check if users exist
    const user = await this.findOne(userId);
    const friend = await this.findOne(friendId);

    if (!user || !friend) {
      throw new Error('User or friend not found');
    }

    if (userId === friendId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if already friends
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        userId: userId,
        friendId: friendId,
      },
    });

    if (existingFriendship) {
      throw new Error('Already friends with this user');
    }

    // Add friendship (bidirectional)
    console.log(`Adding friendship: ${userId} -> ${friendId}`);
    await this.prisma.friendship.createMany({
      data: [
        { userId: userId, friendId: friendId },
        { userId: friendId, friendId: userId },
      ],
    });

    console.log(`Friendship added successfully`);
    return this.findOne(userId);
  }

  async removeFriend(userId: string, friendId: string): Promise<User | null> {
    // Remove friendship (bidirectional)
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return this.findOne(userId);
  }

  async getFriends(userId: string): Promise<FriendUser[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: { userId: userId },
      include: {
        friend: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
            createdAt: true,
            _count: {
              select: {
                playlists: {
                  where: { isPublic: true },
                },
              },
            },
          },
        },
      },
    });

    return friendships.map((f) => f.friend);
  }

  async getFriendStatus(
    userId: string,
    targetUserId: string,
  ): Promise<{
    isFriend: boolean;
    canAddFriend: boolean;
  }> {
    if (userId === targetUserId) {
      return { isFriend: false, canAddFriend: false };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        userId: userId,
        friendId: targetUserId,
      },
    });

    return {
      isFriend: !!friendship,
      canAddFriend: !friendship,
    };
  }

  async getFriendRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<FriendUser[]> {
    // Get users who are not already friends and have public playlists
    const userFriendships = await this.prisma.friendship.findMany({
      where: { userId: userId },
      select: { friendId: true },
    });

    const friendIds = userFriendships.map((f) => f.friendId);

    const recommendations = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: friendIds } },
          { isActive: true },
          {
            playlists: {
              some: { isPublic: true },
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            playlists: {
              where: { isPublic: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return recommendations;
  }

  async searchUsers(
    currentUserId: string,
    query: string,
    limit: number = 10,
  ): Promise<FriendUser[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId, // Exclude current user
            },
          },
          {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            playlists: {
              where: { isPublic: true },
            },
          },
        },
      },
      take: limit,
    });

    return users;
  }
}
