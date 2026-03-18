import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('pin-login')
  @ApiOperation({ summary: 'Login with name and PIN (for staff)' })
  async loginWithPin(@Body() loginDto: { companyId: string; name?: string; pin: string }) {
    return this.authService.loginWithPin(
      loginDto.companyId,
      loginDto.name?.trim() ?? '',
      loginDto.pin,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new customer' })
  async register(@Body() registerDto: { email: string; name: string; phoneNumber?: string }) {
    return this.authService.register(registerDto);
  }

  @Post('staff/create')
  @ApiOperation({ summary: 'Create staff member' })
  async createStaffMember(@Body() createDto: { 
    companyId: string;
    email: string;
    name: string;
    role: string;
    pin: string; // PIN is now required
    password?: string;
    phoneNumber?: string;
  }) {
    return this.authService.createStaffMember(createDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
