import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Company {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  address?: string;
  location?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-system-admin-company-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="system-admin">
      <h1 class="dc-title">Companies</h1>
      <div *ngFor="let company of companies" class="card">
        <div class="card-main">
          <div class="info">
            <strong>{{ company.name }}</strong>
            <small *ngIf="company.slug">{{ company.slug }}</small>
            @if (company.status) {
              <span class="status" [class.active]="company.status === 'ACTIVE'">{{ company.status }}</span>
            }
            @if (company.address || company.location) {
              <small class="location">{{ company.address || company.location }}</small>
            }
          </div>
          <div class="actions">
            <a [routerLink]="['/admin', company.id]" class="btn btn-secondary">Manage</a>
            <button type="button" class="btn btn-primary" (click)="openUrlsModal(company)">Show URLs</button>
          </div>
        </div>
      </div>
      <p *ngIf="companies.length === 0 && !loading">No companies.</p>
      <p *ngIf="loading">Loading…</p>
    </div>

    <div class="modal-overlay" *ngIf="urlsModalCompany" (click)="closeUrlsModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>URLs – {{ urlsModalCompany.name }}</h2>
          <button type="button" class="close" (click)="closeUrlsModal()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="url-row" *ngFor="let row of urlRows">
            <label>{{ row.label }}</label>
            <div class="url-value">
              <code>{{ row.url }}</code>
              <button type="button" class="copy" (click)="copyUrl(row.url)" title="Copy">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .system-admin {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .card {
        border-radius: 16px;
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-elevated);
        padding: 1rem;
      }
      .card-main {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .info { display: flex; flex-direction: column; gap: 0.25rem; }
      .info small { color: var(--text-secondary); }
      .info .status {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        background: var(--bg-canvas);
        display: inline-block;
        margin-top: 0.25rem;
      }
      .info .status.active { background: var(--status-success-soft); color: var(--accent-primary); }
      .info .location { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; }
      .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .btn {
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.9rem;
        border: none;
        cursor: pointer;
      }
      .btn-primary { background: var(--accent-primary); color: var(--text-inverse); }
      .btn-secondary { background: var(--bg-elevated); color: var(--accent-primary); border: 1px solid var(--border-subtle); }
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: var(--bg-elevated);
        border-radius: 16px;
        border: 1px solid var(--border-subtle);
        max-width: 90vw;
        width: 480px;
        max-height: 90vh;
        overflow: auto;
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-subtle);
      }
      .modal-header h2 { margin: 0; font-size: 1.1rem; }
      .close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
      .modal-body { padding: 1.25rem; }
      .url-row { margin-bottom: 1rem; }
      .url-row label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
      .url-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .url-value code {
        flex: 1;
        padding: 0.4rem 0.6rem;
        background: var(--bg-canvas);
        border-radius: 8px;
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .copy { padding: 0.35rem 0.6rem; border-radius: 6px; border: none; background: var(--accent-primary); color: var(--text-inverse); cursor: pointer; font-size: 0.85rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCompanyListPage implements OnInit {
  private readonly api = inject(ApiService);

  companies: Company[] = [];
  loading = true;
  urlsModalCompany: Company | null = null;

  get urlRows(): { label: string; url: string }[] {
    if (!this.urlsModalCompany) return [];
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const id = this.urlsModalCompany.id;
    return [
      { label: 'Kitchen', url: `${base}/kitchen/${id}` },
      { label: 'Bar', url: `${base}/bar/${id}` },
      { label: 'Waiter', url: `${base}/waiter/${id}` },
      { label: 'Admin', url: `${base}/admin/${id}` },
    ];
  }

  ngOnInit(): void {
    this.api.get<Company[]>('companies').subscribe({
      next: (list) => {
        this.companies = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openUrlsModal(company: Company): void {
    this.urlsModalCompany = company;
  }

  closeUrlsModal(): void {
    this.urlsModalCompany = null;
  }

  copyUrl(url: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }
}
