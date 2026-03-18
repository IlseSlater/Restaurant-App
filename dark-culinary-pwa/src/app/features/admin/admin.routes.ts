import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardPage } from './pages/dashboard/admin-dashboard.page';
import { AdminMenuPage } from './pages/menu/admin-menu.page';
import { AdminModifiersPage } from './pages/modifiers/admin-modifiers.page';
import { AdminTablesPage } from './pages/tables/admin-tables.page';
import { AdminStaffPage } from './pages/staff/admin-staff.page';
import { AdminAnalyticsPage } from './pages/analytics/admin-analytics.page';
import { AdminInventoryPage } from './pages/inventory/admin-inventory.page';
import { AdminSpecialsPage } from './pages/specials/admin-specials.page';
import { staffAuthGuard } from '../../core/guards/staff-auth.guard';
import { companyGuard } from '../../core/guards/company.guard';

export const adminRoutes: Routes = [
  {
    path: ':companyGuid',
    canActivate: [staffAuthGuard, companyGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardPage },
      { path: 'menu', component: AdminMenuPage },
      { path: 'modifiers', component: AdminModifiersPage },
      { path: 'tables', component: AdminTablesPage },
      { path: 'staff', component: AdminStaffPage },
      { path: 'analytics', component: AdminAnalyticsPage },
      { path: 'inventory', component: AdminInventoryPage },
      { path: 'specials', component: AdminSpecialsPage },
    ],
  },
];
