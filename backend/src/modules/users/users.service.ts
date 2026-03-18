import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/** Roles that exist in the Prisma UserRole enum (schema). */
const PRISMA_USER_ROLES = [
  'CUSTOMER', 'WAITER', 'KITCHEN_STAFF', 'BAR_STAFF', 'MANAGER', 'ADMIN', 'SYSTEM_ADMIN',
] as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(companyId?: string) {
    const whereClause: any = companyId ? { companyId } : {};
    
    const users = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    return users.map(user => this.transformUser(user));
  }

  async getWaiters(companyId?: string) {
    const whereClause: any = {
      role: 'WAITER',
      ...(companyId ? { companyId } : {})
    };
    
    const waiters = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    
    return waiters.map(user => this.transformUser(user));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user ? this.transformUser(user) : null;
  }

  async createUser(createDto: { 
    email: string; 
    name: string; 
    role: string; 
    password?: string;
    phoneNumber?: string;
    companyId?: string;
    pin?: string; // PIN for staff login
  }) {
    // Validate role against Prisma UserRole enum
    const role = String(createDto.role).toUpperCase();
    if (!PRISMA_USER_ROLES.includes(role as any)) {
      throw new Error(
        `Invalid role "${createDto.role}". Allowed: ${PRISMA_USER_ROLES.join(', ')}`,
      );
    }

    // Hash PIN if provided
    let hashedPin: string | null = null;
    if (createDto.pin) {
      hashedPin = await bcrypt.hash(createDto.pin, 10);
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (createDto.password) {
      hashedPassword = await bcrypt.hash(createDto.password, 10);
    } else {
      hashedPassword = await bcrypt.hash('default123', 10); // Hash default password
    }

    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        name: createDto.name,
        role: role as import('@prisma/client').UserRole,
        password: hashedPassword, // Store hashed password
        phone: createDto.phoneNumber || '', // Store as 'phone' in DB
        companyId: createDto.companyId, // Store the companyId
        pin: hashedPin, // Store hashed PIN
        isActive: true // Set user as active by default
      }
    });
    
    return this.transformUser(user); // Transform to include 'phoneNumber' for frontend
  }

  async updateUser(id: string, updateDto: any) {
    // Build only allowed fields for Prisma User model
    const dbData: Record<string, unknown> = {};

    if (updateDto.name !== undefined) dbData.name = updateDto.name;
    if (updateDto.email !== undefined) dbData.email = updateDto.email;
    if (updateDto.companyId !== undefined) dbData.companyId = updateDto.companyId;
    if (updateDto.isActive !== undefined) dbData.isActive = Boolean(updateDto.isActive);
    if (updateDto.lastLogin !== undefined) dbData.lastLogin = updateDto.lastLogin;

    // phone: frontend may send phoneNumber
    if (updateDto.phoneNumber !== undefined) dbData.phone = updateDto.phoneNumber;
    else if (updateDto.phone !== undefined) dbData.phone = updateDto.phone;

    // role: must match Prisma UserRole enum or update will throw
    if (updateDto.role !== undefined) {
      const role = String(updateDto.role).toUpperCase();
      if (!PRISMA_USER_ROLES.includes(role as any)) {
        throw new Error(
          `Invalid role "${updateDto.role}". Allowed: ${PRISMA_USER_ROLES.join(', ')}`,
        );
      }
      dbData.role = role;
    }

    // password: must be hashed
    if (updateDto.password !== undefined && updateDto.password !== '') {
      dbData.password = await bcrypt.hash(updateDto.password, 10);
    }

    // pin: must be hashed
    if (updateDto.pin !== undefined && updateDto.pin !== '') {
      dbData.pin = await bcrypt.hash(updateDto.pin, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dbData as any,
    });

    return this.transformUser(user);
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  private transformUser(user: any) {
    const { password, pin, phone, ...sanitized } = user;
    return {
      ...sanitized,
      phoneNumber: phone // Map 'phone' to 'phoneNumber' for frontend consistency
    };
  }
}
