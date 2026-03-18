import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';
import { WelcomePage } from './pages/welcome/welcome.page';
import { ScanTablePage } from './pages/scan-table/scan-table.page';
import { RegisterPage } from './pages/register/register.page';
import { MenuPage } from './pages/menu/menu.page';
import { CartPage } from './pages/cart/cart.page';
import { OrdersPage } from './pages/orders/orders.page';
import { BillPage } from './pages/bill/bill.page';
import { customerAuthGuard } from '../../core/guards/customer-auth.guard';

export const customerRoutes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: 'welcome', component: WelcomePage },
      { path: 'scan-table', component: ScanTablePage },
      { path: 'register', component: RegisterPage },
      { path: 'menu', canActivate: [customerAuthGuard], component: MenuPage },
      { path: 'cart', canActivate: [customerAuthGuard], component: CartPage },
      { path: 'orders', canActivate: [customerAuthGuard], component: OrdersPage },
      { path: 'bill', canActivate: [customerAuthGuard], component: BillPage },
    ],
  },
];

