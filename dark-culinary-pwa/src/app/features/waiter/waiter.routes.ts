import { Routes } from '@angular/router';
import { WaiterDashboardPage } from './pages/dashboard/waiter-dashboard.page';
import { staffAuthGuard } from '../../core/guards/staff-auth.guard';
import { companyGuard } from '../../core/guards/company.guard';

export const waiterRoutes: Routes = [
  {
    path: '',
    canActivate: [staffAuthGuard, companyGuard],
    component: WaiterDashboardPage,
  },
];

