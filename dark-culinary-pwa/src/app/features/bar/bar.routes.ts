import { Routes } from '@angular/router';
import { BarBoardPage } from './pages/board/bar-board.page';
import { staffAuthGuard } from '../../core/guards/staff-auth.guard';
import { companyGuard } from '../../core/guards/company.guard';

export const barRoutes: Routes = [
  {
    path: '',
    canActivate: [staffAuthGuard, companyGuard],
    component: BarBoardPage,
  },
];

