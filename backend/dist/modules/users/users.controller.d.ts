import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(companyId?: string): Promise<any[]>;
    getWaiters(companyId?: string): Promise<any[]>;
    getUser(id: string): Promise<any>;
    createUser(createDto: {
        email: string;
        name: string;
        role: string;
        password?: string;
        phoneNumber?: string;
        companyId?: string;
        pin?: string;
    }): Promise<any>;
    updateUser(id: string, updateDto: any): Promise<any>;
    deleteUser(id: string): Promise<{
        id: string;
        companyId: string | null;
        email: string;
        name: string | null;
        phone: string | null;
        password: string | null;
        pin: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
