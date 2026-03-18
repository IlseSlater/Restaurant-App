import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
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
}
export {};
