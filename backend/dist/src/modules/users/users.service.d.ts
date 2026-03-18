import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllUsers(companyId?: string): Promise<any>;
    getWaiters(companyId?: string): Promise<any>;
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
    deleteUser(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$UserPayload<ExtArgs>, T, "delete">>;
    private transformUser;
}
