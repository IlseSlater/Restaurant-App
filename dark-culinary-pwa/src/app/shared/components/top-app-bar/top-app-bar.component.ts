import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TopAppBarAction {
  icon: string;
  label?: string;
  badge?: number;
  id?: string;
  ariaLabel?: string;
}

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule],
  template: `
    <header class="app-bar" [class.app-bar-glass]="glass">
      @if (showBack) {
        <button mat-icon-button type="button" (click)="back.emit()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
      }
      <h1 class="title">{{ title }}</h1>
      <div class="spacer"></div>
      @for (action of actions; track action.icon + (action.id ?? '')) {
        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="action.ariaLabel ?? action.label ?? action.icon"
          (click)="actionClick.emit(action)"
        >
          <span matBadge="{{ action.badge }}" [matBadgeHidden]="!(action.badge && action.badge > 0)">
            <mat-icon>{{ action.icon }}</mat-icon>
          </span>
        </button>
      }
    </header>
  `,
  styles: [
    `
      .app-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        min-height: 56px;
        background-color: var(--bg-elevated);
        border-bottom: 1px solid var(--border-subtle);
      }
      .app-bar-glass {
        background-color: var(--bg-nav);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow-md);
      }
      .title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .spacer {
        flex: 0 0 0.5rem;
        min-width: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopAppBarComponent {
  @Input() title = '';
  @Input() showBack = false;
  @Input() actions: TopAppBarAction[] = [];

  @Input() glass = false;

  @Output() back = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<TopAppBarAction>();
}
