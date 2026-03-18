import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CompanyAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const companyId = request.params.companyGuid || request.params.companyId;
    
    // SYSTEM_ADMIN can access any company
    if (user.role === 'SYSTEM_ADMIN') {
      return true;
    }
    
    // Staff must belong to the company
    if (!user.companyId) {
      throw new ForbiddenException('User not associated with any company');
    }

    if (user.companyId !== companyId) {
      throw new ForbiddenException('Access denied to this company');
    }
    
    return true;
  }
}

