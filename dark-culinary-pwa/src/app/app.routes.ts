import { Routes } from '@angular/router';
import { staffAuthGuard } from './core/guards/staff-auth.guard';
import { companyGuard } from './core/guards/company.guard';
import { managerGuard } from './core/guards/manager.guard';
import { systemAdminGuard } from './core/guards/system-admin.guard';

export const routes: Routes = [
  {
    path: 'customer',
    loadChildren: () =>
      import('./features/customer/customer.routes').then((m) => m.customerRoutes),
  },
  {
    path: 'staff',
    loadChildren: () =>
      import('./features/staff/staff.routes').then((m) => m.staffRoutes),
  },
  {
    path: 'waiter/:companyGuid',
    loadChildren: () =>
      import('./features/waiter/waiter.routes').then((m) => m.waiterRoutes),
    canActivate: [staffAuthGuard, companyGuard],
  },
  {
    path: 'kitchen/:companyGuid',
    loadChildren: () =>
      import('./features/kitchen/kitchen.routes').then((m) => m.kitchenRoutes),
    canActivate: [staffAuthGuard, companyGuard],
  },
  {
    path: 'bar/:companyGuid',
    loadChildren: () =>
      import('./features/bar/bar.routes').then((m) => m.barRoutes),
    canActivate: [staffAuthGuard, companyGuard],
  },
  {
    path: 'manager/:companyGuid',
    loadChildren: () =>
      import('./features/manager/manager.routes').then((m) => m.managerRoutes),
    canActivate: [staffAuthGuard, companyGuard, managerGuard],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'admin/system',
    loadChildren: () =>
      import('./features/system-admin/system-admin.routes').then(
        (m) => m.systemAdminRoutes
      ),
    canActivate: [staffAuthGuard, systemAdminGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'customer/welcome',
  },
];
