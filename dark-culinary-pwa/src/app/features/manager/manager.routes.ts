import { Routes } from '@angular/router';
import { ManagerCommandCenterPage } from './pages/command-center/manager-command-center.page';
import { staffAuthGuard } from '../../core/guards/staff-auth.guard';
import { companyGuard } from '../../core/guards/company.guard';
import { managerGuard } from '../../core/guards/manager.guard';

export const managerRoutes: Routes = [
  {
    path: '',
    canActivate: [staffAuthGuard, companyGuard, managerGuard],
    component: ManagerCommandCenterPage,
  },
];

