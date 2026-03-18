import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ModifierGroup, ModifierOption } from '../../../../core/models/modifier.model';
import { ModifierGroupDialogComponent, ModifierGroupFormValue } from '../../components/modifier-group-dialog/modifier-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-modifiers',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Modifier groups</h2>
      <p class="dc-body muted">Create groups (e.g. Doneness, Side) and add options. Link them to menu items from the Menu tab.</p>

      @if (loading) {
        <p class="loading">Loading…</p>
      } @else {
        <div class="grid">
          @for (group of groups; track group.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ group.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ group.selectionType }} · {{ group.isRequired ? 'Required' : 'Optional' }}
                  @if (group.options.length) {
                    · {{ group.options.length }} option(s)
                  }
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (group.description) {
                  <p class="desc">{{ group.description }}</p>
                }
                @if (group.options.length > 0) {
                  <ul class="options-list">
                    @for (opt of group.options; track opt.id) {
                      <li>
                        <span class="opt-name">{{ opt.name }}</span>
                        @if (opt.priceAdjustment !== 0) {
                          <span class="opt-price">{{ opt.priceAdjustment > 0 ? '+' : '' }}{{ opt.priceAdjustment | number:'1.2-2' }}</span>
                        }
                      </li>
                    }
                  </ul>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="editGroup(group)" aria-label="Edit group">
                  <mat-icon>edit</mat-icon> Edit
                </button>
                <button mat-button color="warn" (click)="deleteGroup(group)" aria-label="Delete group">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
        @if (groups.length === 0) {
          <p class="empty">No modifier groups yet. Create one to get started.</p>
        }
      }

      <button mat-fab color="primary" class="fab" (click)="addGroup()" aria-label="Add modifier group">
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
      }
      .desc {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0 0 var(--space-2);
      }
      .options-list {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.9rem;
      }
      .options-list li {
        display: flex;
        justify-content: space-between;
        gap: var(--space-2);
      }
      .opt-name { flex: 1; }
      .opt-price { color: var(--accent-primary); font-weight: 500; }
      .fab {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminModifiersPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  groups: ModifierGroup[] = [];
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
    this.api.getModifierGroups(this.companyId).subscribe({
      next: (list) => {
        this.groups = list ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  addGroup(): void {
    if (!this.companyId) return;
    const ref = this.dialog.open(ModifierGroupDialogComponent, {
      width: '480px',
      data: { companyId: this.companyId },
    });
    ref.afterClosed().subscribe((result: ModifierGroupFormValue | undefined) => {
      if (!result) return;
      this.api.createModifierGroup({ ...result, companyId: this.companyId! }).subscribe({
        next: () => {
          this.notifications.success('Modifier group added');
          this.load();
        },
        error: () => this.notifications.error('Failed to add modifier group'),
      });
    });
  }

  editGroup(group: ModifierGroup): void {
    const ref = this.dialog.open(ModifierGroupDialogComponent, {
      width: '480px',
      data: { group, companyId: this.companyId! },
    });
    ref.afterClosed().subscribe((result: ModifierGroupFormValue | undefined) => {
      if (!result) return;
      const { options, ...groupFields } = result;
      this.api.updateModifierGroup(group.id, groupFields).subscribe({
        next: () => {
          this.syncOptions(group.id, group.options, options ?? []);
          this.notifications.success('Modifier group updated');
          this.load();
        },
        error: () => this.notifications.error('Failed to update modifier group'),
      });
    });
  }

  private syncOptions(
    groupId: string,
    existing: ModifierOption[],
    next: ModifierGroupFormValue['options']
  ): void {
    const existingIds = new Set(existing.map((o) => o.id));
    const nextIds = new Set(next.filter((o) => o.id).map((o) => o.id!));
    next.forEach((opt) => {
      if (opt.id) {
        this.api.updateModifierOption(opt.id, opt).subscribe();
      } else {
        this.api.addModifierOption(groupId, opt).subscribe();
      }
    });
    existingIds.forEach((id) => {
      if (!nextIds.has(id)) {
        this.api.deleteModifierOption(id).subscribe();
      }
    });
  }

  deleteGroup(group: ModifierGroup): void {
    if (!confirm(`Delete modifier group "${group.name}"? This will not remove it from menu items until you unlink it.`)) return;
    this.api.deleteModifierGroup(group.id).subscribe({
      next: () => {
        this.notifications.success('Modifier group deleted');
        this.load();
      },
      error: () => this.notifications.error('Failed to delete modifier group'),
    });
  }
}
