import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StaffFormDialogComponent } from '../../components/staff-form-dialog/staff-form-dialog.component';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Staff management</h2>

      <div *ngIf="users.length > 0" class="list">
        <div *ngFor="let u of users" class="row">
          <span class="name">{{ u.name || u.email }}</span>
          <span class="email">{{ u.email }}</span>
          <span class="role">{{ u.role }}</span>
          <mat-slide-toggle [checked]="u.active" (change)="toggleActive(u)"></mat-slide-toggle>
          <div class="actions">
            <button mat-icon-button (click)="editUser(u)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="deleteUser(u)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
      </div>
      <p *ngIf="users.length === 0 && !loading">No staff.</p>
      <p *ngIf="loading">Loading…</p>

      <button mat-flat-button color="primary" (click)="addUser()" class="add-btn">
        <mat-icon>add</mat-icon>
        Create user
      </button>
    </div>
  `,
  styles: [
    `
      .admin-page { display: flex; flex-direction: column; gap: 1rem; }
      .list { display: flex; flex-direction: column; gap: 0.5rem; }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr auto auto auto;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }
      .row .email { color: var(--text-secondary); font-size: 0.9rem; }
      .actions { display: flex; gap: 0.25rem; }
      .add-btn { align-self: flex-start; }
      .add-btn mat-icon { margin-right: 0.5rem; vertical-align: middle; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStaffPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  users: UserRow[] = [];
  loading = true;
  companyId: string | null = null;

  ngOnInit(): void {
    this.companyContext.companyId$.subscribe((companyId: string | null) => {
      this.companyId = companyId;
      if (!companyId) return;
      this.load();
    });
  }

  private load(): void {
    if (!this.companyId) return;
    this.loading = true;
    this.cdr.markForCheck();
    this.api.get<Record<string, unknown>[]>('users', { companyId: this.companyId }).subscribe({
      next: (list) => {
        this.users = (Array.isArray(list) ? list : []).map((u) => ({
          id: String(u['id'] ?? ''),
          name: String(u['name'] ?? ''),
          email: String(u['email'] ?? ''),
          role: String(u['role'] ?? ''),
          active: u['active'] !== false && u['isActive'] !== false,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  addUser(): void {
    const ref = this.dialog.open(StaffFormDialogComponent, { width: '400px', data: null });
    ref.afterClosed().subscribe((result: { name: string; email: string; password: string; role: string } | undefined) => {
      if (!result || !this.companyId) return;
      this.api.post('auth/staff/create', { ...result, companyId: this.companyId }).subscribe({
        next: () => { this.notifications.success('User created'); this.load(); },
        error: (err) => this.notifications.error(err.error?.message ?? 'Failed to create user'),
      });
    });
  }

  editUser(u: UserRow): void {
    const ref = this.dialog.open(StaffFormDialogComponent, {
      width: '400px',
      data: { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active },
    });
    ref.afterClosed().subscribe((result: { name: string; email: string; role: string; active: boolean } | undefined) => {
      if (!result) return;
      this.api.put(`users/${u.id}`, result).subscribe({
        next: () => { this.notifications.success('User updated'); this.load(); },
        error: () => this.notifications.error('Failed to update user'),
      });
    });
  }

  toggleActive(u: UserRow): void {
    const next = !u.active;
    this.api.put(`users/${u.id}`, { active: next }).subscribe({
      next: () => { u.active = next; this.cdr.markForCheck(); },
      error: () => this.notifications.error('Failed to update'),
    });
  }

  deleteUser(u: UserRow): void {
    if (!confirm(`Delete ${u.email}?`)) return;
    this.api.delete(`users/${u.id}`).subscribe({
      next: () => { this.notifications.success('User deleted'); this.load(); },
      error: () => this.notifications.error('Failed to delete user'),
    });
  }
}
