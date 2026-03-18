import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, SpecialDto, SpecialType } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { SpecialBuilderDialogComponent, SpecialFormValue } from '../../components/special-builder-dialog/special-builder-dialog.component';

@Component({
  selector: 'app-admin-specials',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Specials &amp; promotions</h2>
      <p class="dc-body muted">
        Time-based (Happy Hour), conditional upsells, multi-slot bundles, or auto-appended charges (corkage).
        Use the rule builder to define when a special applies.
      </p>

      @if (loading()) {
        <p class="loading">Loading…</p>
      } @else {
        <div class="grid">
          @for (s of specials(); track s.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ s.name }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip [class.active]="s.isActive">{{ s.specialType }}</mat-chip>
                  @if (!s.isActive) {
                    <mat-chip color="warn">Inactive</mat-chip>
                  }
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (s.description) {
                  <p class="desc">{{ s.description }}</p>
                }
                @if (s.specialType === 'TIME_BASED' && s.startTime && s.endTime) {
                  <p class="meta">{{ s.startTime }} – {{ s.endTime }}</p>
                }
                @if (s.bundlePrice != null) {
                  <p class="meta">Bundle price: {{ s.bundlePrice | currency:'ZAR':'symbol':'1.2-2' }}</p>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="edit(s)" aria-label="Edit special">
                  <mat-icon>edit</mat-icon> Edit
                </button>
                <button mat-button color="warn" (click)="delete(s)" aria-label="Delete special">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
        @if (specials().length === 0) {
          <p class="empty">No specials yet. Create one to run Happy Hour, upsells, or bundles.</p>
        }
      }

      <button mat-fab color="primary" class="fab" (click)="add()" aria-label="Add special">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .admin-page {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        position: relative;
        padding-bottom: 80px;
      }
      .muted {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
      .loading, .empty {
        color: var(--text-muted);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }
      .card {
        background: var(--bg-glass);
        border: 1px solid var(--border-subtle);
      }
      .card mat-card-header {
        padding-bottom: 0;
      }
      .card mat-card-title {
        font-size: 1.1rem;
      }
      .card mat-card-subtitle {
        font-size: 0.8rem;
        color: var(--text-muted);
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .card mat-chip.active {
        background: var(--status-success-soft);
        color: var(--status-success);
      }
      .desc, .meta {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0 0 var(--space-2);
      }
      .fab {
        position: fixed;
        bottom: var(--space-6);
        right: var(--space-6);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpecialsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly specials = signal<SpecialDto[]>([]);
  readonly loading = signal(true);
  companyId: string | null = null;

  ngOnInit(): void {
    this.companyContext.companyId$.subscribe((id) => {
      this.companyId = id;
      if (id) this.load();
    });
  }

  private load(): void {
    if (!this.companyId) return;
    this.loading.set(true);
    this.api.getSpecials(this.companyId).subscribe({
      next: (list) => {
        this.specials.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error('Failed to load specials');
      },
    });
  }

  add(): void {
    if (!this.companyId) return;
    const ref = this.dialog.open(SpecialBuilderDialogComponent, {
      width: 'min(560px, 96vw)',
      data: { companyId: this.companyId },
    });
    ref.afterClosed().subscribe((result: SpecialFormValue | undefined) => {
      if (!result) return;
      this.api.createSpecial({ ...result, companyId: this.companyId! }).subscribe({
        next: () => {
          this.notifications.success('Special created');
          this.load();
        },
        error: (err) => this.notifications.error(err?.error?.message ?? 'Failed to create special'),
      });
    });
  }

  edit(s: SpecialDto): void {
    const ref = this.dialog.open(SpecialBuilderDialogComponent, {
      width: 'min(560px, 96vw)',
      data: { companyId: s.companyId, special: s },
    });
    ref.afterClosed().subscribe((result: SpecialFormValue | undefined) => {
      if (!result) return;
      this.api.updateSpecial(s.id, result).subscribe({
        next: () => {
          this.notifications.success('Special updated');
          this.load();
        },
        error: (err) => this.notifications.error(err?.error?.message ?? 'Failed to update special'),
      });
    });
  }

  delete(s: SpecialDto): void {
    if (!confirm(`Delete special "${s.name}"?`)) return;
    this.api.deleteSpecial(s.id).subscribe({
      next: () => {
        this.notifications.success('Special deleted');
        this.load();
      },
      error: (err) => this.notifications.error(err?.error?.message ?? 'Failed to delete special'),
    });
  }
}
