import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed()" [class.drawer-open]="drawerOpen()">
      <aside class="sidebar">
        <div class="sidebar-head">
          <button mat-icon-button type="button" class="toggle" (click)="toggleSidebar()" aria-label="Toggle sidebar">
            <mat-icon>menu</mat-icon>
          </button>
          @if (!sidebarCollapsed()) {
            <div class="company">
              @if (company()?.logo) {
                <img [src]="company()?.logo" alt="" class="company-logo" />
              } @else {
                <div class="company-logo-placeholder"><mat-icon>restaurant</mat-icon></div>
              }
              <span class="company-name">{{ company()?.name ?? 'Admin' }}</span>
            </div>
          }
        </div>

        <nav class="nav">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="[item.path]"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '.' }"
              class="nav-link"
            >
              <mat-icon [fontIcon]="item.icon" />
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-foot">
          @if (!sidebarCollapsed()) {
            <div class="user-info">
              <span class="user-name">{{ user()?.name || user()?.email || 'User' }}</span>
              <span class="user-role">{{ user()?.role ?? '' }}</span>
            </div>
          }
          <button mat-icon-button type="button" (click)="logout()" aria-label="Log out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <div class="backdrop" (click)="closeDrawer()" [class.visible]="drawerOpen() && isMobile()"></div>

      <div class="main-wrap">
        <header class="header">
          <button mat-icon-button type="button" class="menu-btn" (click)="toggleDrawer()" aria-label="Menu">
            <mat-icon>menu</mat-icon>
          </button>
          <h1 class="page-title">{{ pageTitle() }}</h1>
          <div class="header-actions">
            <button mat-icon-button type="button" aria-label="Notifications">
              <mat-icon>notifications</mat-icon>
            </button>
            <a [routerLink]="['.']" [queryParams]="{ theme: '1' }" mat-icon-button aria-label="Theme settings">
              <mat-icon>palette</mat-icon>
            </a>
            <div class="avatar" [title]="user()?.email ?? ''">
              {{ userInitials() }}
            </div>
          </div>
        </header>

        <main class="admin-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        min-height: 100vh;
        background: var(--bg-canvas);
        color: var(--text-primary);
        display: flex;
      }

      .sidebar {
        width: 260px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background: var(--bg-elevated);
        border-right: 1px solid var(--border-subtle);
        transition: width 0.2s ease;
        z-index: 100;
      }

      .admin-layout.sidebar-collapsed .sidebar {
        width: 64px;
      }

      .sidebar-head {
        padding: 1rem;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 56px;
      }

      .sidebar-head .toggle {
        display: none;
      }

      .company {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
      }

      .company-logo {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        object-fit: cover;
      }

      .company-logo-placeholder {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .company-logo-placeholder mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .company-name {
        font-weight: 600;
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav {
        flex: 1;
        padding: 0.75rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        margin: 0 0.5rem;
        border-radius: 10px;
        color: var(--text-secondary);
        text-decoration: none;
        transition: background 0.15s, color 0.15s;
        border-left: 3px solid transparent;
      }

      .nav-link:hover {
        background: var(--bg-glass);
        color: var(--text-primary);
      }

      .nav-link.active {
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        border-left-color: var(--accent-primary);
      }

      .nav-link mat-icon {
        flex-shrink: 0;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .nav-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sidebar-foot {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .user-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: capitalize;
      }

      .main-wrap {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .header {
        height: 56px;
        padding: 0 1rem;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--bg-elevated);
      }

      .menu-btn {
        display: none;
      }

      .page-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        flex: 1;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .admin-main {
        flex: 1;
        padding: 1.5rem;
        overflow: auto;
      }

      .backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        z-index: 99;
      }

      .backdrop.visible {
        display: block;
      }

      @media (max-width: 767px) {
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          transform: translateX(-100%);
          transition: transform 0.2s ease;
        }

        .admin-layout.drawer-open .sidebar {
          transform: translateX(0);
        }

        .admin-layout.sidebar-collapsed .sidebar {
          width: 260px;
        }

        .sidebar-head .toggle {
          display: block;
        }

        .menu-btn {
          display: block;
        }

        .company-name {
          display: block;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly companyContext = inject(CompanyContextService);
  private readonly auth = inject(AuthService);

  readonly sidebarCollapsed = signal(false);
  readonly drawerOpen = signal(false);

  readonly company = toSignal(this.companyContext.currentCompany$, { initialValue: null });
  readonly user = signal(this.auth.currentUserSnapshot);

  readonly navItems: NavItem[] = [
    { path: '.', label: 'Dashboard', icon: 'dashboard' },
    { path: 'menu', label: 'Menu', icon: 'restaurant_menu' },
    { path: 'modifiers', label: 'Modifiers', icon: 'tune' },
    { path: 'tables', label: 'Tables', icon: 'table_restaurant' },
    { path: 'staff', label: 'Staff', icon: 'people' },
    { path: 'analytics', label: 'Analytics', icon: 'analytics' },
    { path: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: 'specials', label: 'Specials', icon: 'local_offer' },
  ];

  readonly pageTitle = computed(() => {
    const url = this.router.url;
    if (url.endsWith('/menu') || url.includes('/menu')) return 'Menu';
    if (url.endsWith('/modifiers') || url.includes('/modifiers')) return 'Modifiers';
    if (url.endsWith('/tables') || url.includes('/tables')) return 'Tables';
    if (url.endsWith('/staff') || url.includes('/staff')) return 'Staff';
    if (url.endsWith('/analytics') || url.includes('/analytics')) return 'Analytics';
    if (url.endsWith('/inventory') || url.includes('/inventory')) return 'Inventory';
    if (url.endsWith('/specials') || url.includes('/specials')) return 'Specials';
    return 'Dashboard';
  });

  readonly userInitials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    if (u.name) {
      const parts = u.name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (u.email) return u.email.slice(0, 2).toUpperCase();
    return '?';
  });

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((u) => this.user.set(u ?? null));
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    const guid = this.route.snapshot.paramMap.get('companyGuid');
    this.router.navigate(['/staff', 'login', guid ?? '']);
  }
}
