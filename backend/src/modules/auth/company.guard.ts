import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.params.companyId;
    const userId = request.user?.id;

    if (!companyId) {
      return true; // Allow access to non-company-scoped endpoints
    }

    if (!userId) {
      throw new ForbiddenException('User authentication required');
    }

    // Check if user has access to this company
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId: companyId,
      },
    });

    if (!user) {
      throw new ForbiddenException('Access denied to company data');
    }

    return true;
  }
}
