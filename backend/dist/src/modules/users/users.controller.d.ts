import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
}
