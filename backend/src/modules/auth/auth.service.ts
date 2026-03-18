import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // Name + PIN-based authentication for staff
  async loginWithPin(companyId: string, name: string, pin: string) {
    const trimmedName = (name ?? '').trim();
    console.log('🔍 PIN Login Debug:', { companyId, name: trimmedName || '(any)', pin: pin ? '***' : '' });

    if (!companyId || !pin) {
      throw new UnauthorizedException('Company and PIN are required');
    }

    // Build where: company + optional name + has PIN + active
    const where: { companyId: string; isActive: boolean; pin: { not: null }; name?: string } = {
      companyId,
      isActive: true,
      pin: { not: null },
    };
    if (trimmedName) {
      where.name = trimmedName;
    }

    const user = await this.prisma.user.findFirst({
      where,
      include: { company: true },
    });

    console.log('🔍 User found:', user ? { id: user.id, name: user.name, companyId: user.companyId, hasPin: !!user.pin } : 'No user found');

    if (!user) {
      const allUsersInCompany = await this.prisma.user.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, role: true, pin: true },
      });
      console.log('🔍 All users in company:', allUsersInCompany);
      throw new UnauthorizedException('Invalid name or PIN');
    }

    // Check PIN for this specific user
    console.log('🔍 PIN comparison:', { hasStoredPin: !!user.pin });
    if (!user.pin) {
      throw new UnauthorizedException('Invalid name or PIN');
    }
    let pinValid: boolean;
    try {
      pinValid = await bcrypt.compare(pin, user.pin);
    } catch (e) {
      console.error('PIN compare error:', e);
      throw new UnauthorizedException('Invalid name or PIN');
    }
    if (pinValid) {
      console.log('✅ PIN match successful');
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        access_token: this.generateToken(user),
        user: this.sanitizeUser(user)
      };
    }

    console.log('❌ PIN comparison failed');
    throw new UnauthorizedException('Invalid name or PIN');
  }

  // Full account authentication
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.password) {
      throw new UnauthorizedException('Password not set. Please use PIN login.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return {
      access_token: this.generateToken(user),
      user: this.sanitizeUser(user)
    };
  }

  // Register customer (simplified - no password required for customers)
  async register(registerDto: { email: string; name: string; phoneNumber?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phoneNumber,
        role: 'CUSTOMER',
      },
    });

    return {
      access_token: this.generateToken(user),
      user: this.sanitizeUser(user)
    };
  }

  // Create staff member with PIN
  async createStaffMember(createDto: { 
    companyId: string;
    email: string;
    name: string;
    phoneNumber?: string;
    role: string;
    pin: string; // PIN is now required
    password?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check for duplicate name + PIN combination in the same company
    const duplicateUser = await this.prisma.user.findFirst({
      where: {
        companyId: createDto.companyId,
        name: createDto.name.trim(),
        isActive: true
      }
    });

    if (duplicateUser) {
      throw new BadRequestException('A staff member with this name already exists in this company');
    }

    const hashedPin = await bcrypt.hash(createDto.pin, 10);
    console.log('🔧 Creating staff member:', { 
      name: createDto.name.trim(), 
      companyId: createDto.companyId, 
      role: createDto.role,
      pinProvided: !!createDto.pin,
      pinLength: createDto.pin?.length,
      pinHashed: !!hashedPin
    });

    const data: any = {
      companyId: createDto.companyId,
      email: createDto.email,
      name: createDto.name.trim(), // Trim whitespace
      phone: createDto.phoneNumber, // Map phoneNumber to phone field
      role: createDto.role,
      pin: hashedPin, // PIN is required and hashed
    };

    if (createDto.password) {
      data.password = await bcrypt.hash(createDto.password, 10);
    }

    console.log('🔧 User data to create:', { 
      name: data.name, 
      companyId: data.companyId, 
      role: data.role,
      hasPin: !!data.pin,
      pinLength: data.pin?.length
    });

    const user = await this.prisma.user.create({
      data,
      include: { company: true }
    });

    console.log('✅ User created successfully:', { 
      id: user.id, 
      name: user.name, 
      companyId: user.companyId,
      hasPin: !!user.pin,
      pinLength: user.pin?.length
    });

    return this.sanitizeUser(user);
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(user: any): string {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, pin, phone, ...sanitized } = user;
    return {
      ...sanitized,
      phoneNumber: phone // Map 'phone' field to 'phoneNumber' for frontend
    };
  }
}

