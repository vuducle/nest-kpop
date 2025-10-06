import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@prisma/client';

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
}
