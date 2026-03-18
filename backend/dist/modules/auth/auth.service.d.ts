import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    loginWithPin(companyId: string, name: string, pin: string): Promise<{
        access_token: string;
        user: any;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: {
        email: string;
        name: string;
        phoneNumber?: string;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
    createStaffMember(createDto: {
        companyId: string;
        email: string;
        name: string;
        phoneNumber?: string;
        role: string;
        pin: string;
        password?: string;
    }): Promise<any>;
    getProfile(id: string): Promise<{
        company: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            address: string | null;
            website: string | null;
            isActive: boolean;
            slug: string;
            logo: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
            timezone: string;
            currency: string;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            locationRadius: number | null;
        } | null;
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string | null;
        email: string;
        phone: string | null;
        password: string | null;
        pin: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLogin: Date | null;
    }>;
    private generateToken;
    private sanitizeUser;
}
