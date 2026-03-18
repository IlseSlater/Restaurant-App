import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithPin(loginDto: {
        companyId: string;
        name?: string;
        pin: string;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
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
        role: string;
        pin: string;
        password?: string;
        phoneNumber?: string;
    }): Promise<any>;
    getProfile(req: any): Promise<any>;
}
