import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AppCurrencyPipe,
  ],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Analytics</h2>

      <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>From</mat-label>
          <input matInput type="date" [(ngModel)]="dateFrom" (ngModelChange)="companyId && loadData(companyId!)" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To</mat-label>
          <input matInput type="date" [(ngModel)]="dateTo" (ngModelChange)="companyId && loadData(companyId!)" />
        </mat-form-field>
      </div>

      <section class="realtime" *ngIf="realtime">
        <h3>Realtime</h3>
        <div class="metrics">
          <div class="metric"><span class="value">{{ realtime.activeOrders }}</span> Active orders</div>
          <div class="metric"><span class="value">{{ realtime.revenueToday | appCurrency }}</span> Revenue today</div>
        </div>
      </section>

      <section class="overview" *ngIf="overview">
        <h3>Overview</h3>
        <div class="metrics">
          <div class="metric"><span class="value">{{ $any(overview['revenueToday']) | appCurrency }}</span> Revenue today</div>
          <div class="metric"><span class="value">{{ overview['totalOrders'] }}</span> Total orders</div>
          <div class="metric"><span class="value">{{ $any(overview['averageOrderValue']) | appCurrency }}</span> Avg order value</div>
        </div>
      </section>

      <section class="top-items" *ngIf="topItems.length > 0">
        <h3>Top selling items</h3>
        <div class="chart">
          @for (item of topItems; track item.name) {
            <div class="bar-row">
              <span class="label">{{ item.name }}</span>
              <div class="bar-wrap">
                <div class="bar" [style.width.%]="barWidth(item)"></div>
              </div>
              <span class="count">{{ item.count }}</span>
            </div>
          }
        </div>
      </section>

      <p *ngIf="!overview && !realtime && topItems.length === 0 && !loading">No data.</p>
      <p *ngIf="loading">Loading…</p>
    </div>
  `,
  styles: [
    `
      .admin-page { display: flex; flex-direction: column; gap: 1.5rem; }
      .toolbar { display: flex; flex-wrap: wrap; gap: 1rem; }
      section h3 { font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
      .metrics { display: flex; flex-wrap: wrap; gap: 1rem; }
      .metric { padding: 0.75rem 1rem; border-radius: 8px; background: var(--bg-elevated); }
      .metric .value { display: block; font-size: 1.25rem; color: var(--accent-primary); }
      .chart { display: flex; flex-direction: column; gap: 0.5rem; }
      .bar-row { display: grid; grid-template-columns: 120px 1fr auto; align-items: center; gap: 0.75rem; }
      .bar-wrap { height: 24px; background: var(--bg-canvas); border-radius: 4px; overflow: hidden; }
      .bar { height: 100%; background: var(--accent-primary); border-radius: 4px; min-width: 2px; }
      .count { font-weight: 600; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnalyticsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  overview: Record<string, unknown> | null = null;
  realtime: { activeOrders: number; revenueToday: number } | null = null;
  topItems: { name: string; count: number }[] = [];
  loading = true;
  dateFrom = '';
  dateTo = '';
  companyId: string | null = null;

  ngOnInit(): void {
    const today = new Date();
    this.dateTo = today.toISOString().slice(0, 10);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    this.dateFrom = weekAgo.toISOString().slice(0, 10);

    this.companyContext.companyId$.subscribe((companyId: string | null) => {
      this.companyId = companyId;
      if (!companyId) return;
      this.loadData(companyId);
    });
  }

  loadData(companyId?: string | null): void {
    const cid = companyId ?? null;
    if (!cid) return;
    this.loading = true;
    this.cdr.markForCheck();

    this.api.get<Record<string, unknown>>('analytics/realtime', { companyId: cid }).subscribe({
      next: (data) => {
        this.realtime = { activeOrders: Number(data['activeOrders'] ?? 0), revenueToday: Number(data['revenueToday'] ?? 0) };
        this.cdr.markForCheck();
      },
    });

    this.api.get<Record<string, unknown>>('analytics/overview', { companyId: cid }).subscribe({
      next: (data) => {
        this.overview = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });

    this.api.get<unknown[]>('analytics/top-items', { companyId: cid }).subscribe({
      next: (list) => {
        this.topItems = (Array.isArray(list) ? list : []).map((x: unknown) => {
        const r = x as Record<string, unknown>;
        return ({
          name: String(r['name'] ?? ''),
          count: Number(r['count'] ?? 0),
        });
      });
        this.cdr.markForCheck();
      },
    });
  }

  barWidth(item: { count: number }): number {
    const max = Math.max(...this.topItems.map((i) => i.count), 1);
    return (item.count / max) * 100;
  }
}
