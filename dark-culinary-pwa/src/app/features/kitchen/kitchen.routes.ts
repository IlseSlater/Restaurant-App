import { Routes } from '@angular/router';
import { KitchenBoardPage } from './pages/board/kitchen-board.page';
import { staffAuthGuard } from '../../core/guards/staff-auth.guard';
import { companyGuard } from '../../core/guards/company.guard';

export const kitchenRoutes: Routes = [
  {
    path: '',
    canActivate: [staffAuthGuard, companyGuard],
    component: KitchenBoardPage,
  },
];

