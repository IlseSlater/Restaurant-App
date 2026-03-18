import { Routes } from '@angular/router';
import { StaffLoginPage } from './pages/login/staff-login.page';

export const staffRoutes: Routes = [
  {
    path: 'login/:companyGuid',
    component: StaffLoginPage,
  },
];

