import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CustomerSessionService } from '../../services/customer-session.service';

export interface JoinTableSheetData {
  tableNumber: number | string;
  sessionId: string;
  participants: { id: string; displayName: string; isCreator?: boolean }[];
}

@Component({
  selector: 'app-join-table-sheet',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="join-sheet">
      <h2 class="sheet-title">Who are you?</h2>
      <p class="sheet-desc">Table {{ data.tableNumber }} already has an active session. Select yourself to rejoin, or join as a new guest.</p>
      <div class="participant-actions">
        @for (p of data.participants; track p.id) {
          <button mat-stroked-button type="button" class="participant-btn" (click)="rejoinAs(p.id)" [disabled]="joining()">
            <mat-icon class="person-icon">person</mat-icon>
            {{ p.displayName }}{{ p.isCreator ? ' (table host)' : '' }}
          </button>
        }
        <button mat-stroked-button type="button" class="participant-btn new-guest" (click)="joinAsNew()" [disabled]="joining()">
          <mat-icon>person_add</mat-icon>
          I'm someone new
        </button>
      </div>
      @if (joining()) {
        <p class="joining-msg">{{ joining() }}</p>
      }
      <div class="actions">
        <button mat-button (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
  styles: [
    `
      .join-sheet {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .sheet-title {
        margin: 0;
        font-size: 1.25rem;
      }
      .sheet-desc {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }
      .participant-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .participant-btn {
        justify-content: flex-start;
        text-transform: none;
      }
      .participant-btn.new-guest {
        font-style: italic;
        border-style: dashed;
      }
      .person-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        margin-right: 0.5rem;
        vertical-align: middle;
        color: var(--text-muted);
      }
      .joining-msg {
        margin: 0.5rem 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .actions button {
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinTableSheetComponent {
  readonly data = inject<JoinTableSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly ref = inject(MatBottomSheetRef<JoinTableSheetComponent>);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly router = inject(Router);

  readonly joining = signal<string | null>(null);

  rejoinAs(participantId: string): void {
    this.joining.set('Joining…');
    this.sessionService.joinSession(this.data.sessionId, { participantId }).subscribe({
      next: () => {
        this.ref.dismiss(false);
        void this.router.navigate(['/customer/menu']);
      },
      error: () => {
        this.joining.set(null);
      },
    });
  }

  joinAsNew(): void {
    this.ref.dismiss(true);
  }

  cancel(): void {
    this.ref.dismiss(false);
  }
}
