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
    getProfile(id: string): Promise<any>;
    private generateToken;
    private sanitizeUser;
}
