import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { SpecialDto, SpecialType } from '../../../../core/services/api.service';

export interface RuleConditionNode {
  id: string;
  type: 'category_count';
  category: string;
  op: '>=' | '==';
  value: number;
}

export interface RuleActionNode {
  type: 'bundle_price' | 'discount_percent';
  value: number;
}

export interface SpecialFormValue {
  name: string;
  description?: string;
  specialType: SpecialType;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  triggerCategory?: string;
  triggerItemIds?: string[];
  chargePerUnit?: number;
  unitType?: string;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  ruleDefinition?: { conditions: RuleConditionNode[]; action: RuleActionNode };
}

export interface SpecialBuilderDialogData {
  companyId: string;
  special?: SpecialDto;
}

@Component({
  selector: 'app-special-builder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.special ? 'Edit special' : 'New special' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="specialType">
            <mat-option value="TIME_BASED">Time-based (Happy Hour)</mat-option>
            <mat-option value="CONDITIONAL">Conditional upsell</mat-option>
            <mat-option value="MULTI_SLOT">Multi-slot bundle</mat-option>
            <mat-option value="AUTO_APPENDED">Auto-appended (corkage)</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="full-width row">
          <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
        </div>

        @if (form.get('specialType')?.value === 'TIME_BASED') {
          <div class="row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Start (HH:mm)</mat-label>
              <input matInput formControlName="startTime" placeholder="16:00" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End (HH:mm)</mat-label>
              <input matInput formControlName="endTime" placeholder="18:00" />
            </mat-form-field>
          </div>
        }

        @if (form.get('specialType')?.value === 'CONDITIONAL') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Trigger category (e.g. Main)</mat-label>
            <input matInput formControlName="triggerCategory" />
          </mat-form-field>
        }

        @if (form.get('specialType')?.value === 'AUTO_APPENDED') {
          <div class="row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Charge per unit</mat-label>
              <input matInput type="number" formControlName="chargePerUnit" min="0" step="0.01" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Unit type</mat-label>
              <mat-select formControlName="unitType">
                <mat-option value="guest">Per guest</mat-option>
                <mat-option value="table">Per table</mat-option>
                <mat-option value="order">Per order</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }

        <div class="row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Bundle / fixed price</mat-label>
            <input matInput type="number" formControlName="bundlePrice" min="0" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Discount %</mat-label>
            <input matInput type="number" formControlName="discountPercent" min="0" max="100" step="1" />
          </mat-form-field>
        </div>

        <h3 class="rule-heading">Rule builder</h3>
        <p class="rule-hint">When should this special apply? Add conditions and an action.</p>
        <div class="rule-nodes" formArrayName="conditions">
          @for (ctrl of conditions.controls; track $index; let i = $index) {
            <div class="rule-node condition" [formGroupName]="i">
              <span class="node-label">IF</span>
              <mat-form-field appearance="outline" class="node-field">
                <mat-label>Category</mat-label>
                <input matInput formControlName="category" placeholder="Spirits" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="node-field op">
                <mat-label>Count</mat-label>
                <mat-select formControlName="op">
                  <mat-option value=">=">≥</mat-option>
                  <mat-option value="==">=</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="node-field num">
                <mat-label>Value</mat-label>
                <input matInput type="number" formControlName="value" min="0" />
              </mat-form-field>
              @if (i < conditions.controls.length - 1) {
                <span class="and-badge">AND</span>
              }
              <button mat-icon-button type="button" (click)="removeCondition(i)" aria-label="Remove condition">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
        <button mat-stroked-button type="button" (click)="addCondition()" class="add-condition">
          <mat-icon>add</mat-icon> Add condition
        </button>

        <div class="rule-node action">
          <span class="node-label">THEN</span>
          <mat-form-field appearance="outline" class="node-field">
            <mat-label>Action</mat-label>
            <mat-select formControlName="actionType">
              <mat-option value="bundle_price">Apply bundle price</mat-option>
              <mat-option value="discount_percent">Apply discount %</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="node-field">
            <mat-label>Value</mat-label>
            <input matInput type="number" formControlName="actionValue" min="0" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        min-width: 320px;
        padding-top: 0.5rem;
      }
      .full-width { width: 100%; }
      .row { display: flex; align-items: center; gap: var(--space-3); }
      .two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }
      .rule-heading {
        font-size: 1rem;
        margin: var(--space-4) 0 var(--space-2);
        font-weight: 600;
      }
      .rule-hint {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin: 0 0 var(--space-2);
      }
      .rule-nodes {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .rule-node {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2);
        background: var(--bg-elevated);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
      }
      .rule-node.condition {
        border-left: 3px solid var(--accent-primary);
      }
      .rule-node.action {
        border-left: 3px solid var(--status-success);
      }
      .node-label {
        font-weight: 600;
        font-size: 0.85rem;
        min-width: 2.5rem;
      }
      .node-field {
        flex: 1;
        min-width: 100px;
      }
      .node-field.op { max-width: 80px; }
      .node-field.num { max-width: 80px; }
      .and-badge {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        background: var(--bg-glass);
        border-radius: var(--radius-sm);
      }
      .add-condition {
        align-self: flex-start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialBuilderDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<SpecialBuilderDialogComponent>);
  readonly data: SpecialBuilderDialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;

  get conditions(): FormArray {
    return this.form.get('conditions') as FormArray;
  }

  ngOnInit(): void {
    const s = this.data.special;
    const rule = (s?.ruleDefinition as { conditions?: RuleConditionNode[]; action?: RuleActionNode }) ?? {};
    const conditions = (rule.conditions ?? []).length
      ? rule.conditions!.map((c) =>
          this.fb.group({
            category: [c.category ?? '', Validators.required],
            op: [c.op ?? '>=', Validators.required],
            value: [c.value ?? 1, [Validators.required, Validators.min(0)]],
          })
        )
      : [this.fb.group({ category: ['', Validators.required], op: ['>=', Validators.required], value: [1, [Validators.required, Validators.min(0)]] })];

    this.form = this.fb.group({
      name: [s?.name ?? '', Validators.required],
      description: [s?.description ?? ''],
      specialType: [s?.specialType ?? 'TIME_BASED', Validators.required],
      isActive: [s?.isActive !== false],
      startTime: [s?.startTime ?? ''],
      endTime: [s?.endTime ?? ''],
      daysOfWeek: [s?.daysOfWeek ?? []],
      triggerCategory: [s?.triggerCategory ?? ''],
      triggerItemIds: [s?.triggerItemIds ?? []],
      chargePerUnit: [s?.chargePerUnit ?? null],
      unitType: [s?.unitType ?? 'guest'],
      discountPercent: [s?.discountPercent ?? null],
      fixedPrice: [s?.fixedPrice ?? null],
      bundlePrice: [s?.bundlePrice ?? null],
      conditions: this.fb.array(conditions as FormGroup[]),
      actionType: [rule.action?.type ?? 'bundle_price', Validators.required],
      actionValue: [rule.action?.value ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addCondition(): void {
    this.conditions.push(
      this.fb.group({
        category: ['', Validators.required],
        op: ['>=', Validators.required],
        value: [1, [Validators.required, Validators.min(0)]],
      })
    );
  }

  removeCondition(index: number): void {
    if (this.conditions.length <= 1) return;
    this.conditions.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const conditions: RuleConditionNode[] = (v.conditions ?? []).map((c: { category: string; op: string; value: number }, i: number) => ({
      id: `cond-${i}`,
      type: 'category_count',
      category: c.category ?? '',
      op: (c.op === '==' ? '==' : '>=') as '>=' | '==',
      value: Number(c.value) || 0,
    }));
    const action: RuleActionNode = {
      type: v.actionType ?? 'bundle_price',
      value: Number(v.actionValue) ?? 0,
    };
    const result: SpecialFormValue = {
      name: v.name,
      description: v.description || undefined,
      specialType: v.specialType,
      isActive: v.isActive,
      startTime: v.startTime || undefined,
      endTime: v.endTime || undefined,
      daysOfWeek: v.daysOfWeek,
      triggerCategory: v.triggerCategory || undefined,
      triggerItemIds: v.triggerItemIds,
      chargePerUnit: v.chargePerUnit != null ? Number(v.chargePerUnit) : undefined,
      unitType: v.unitType || undefined,
      discountPercent: v.discountPercent != null ? Number(v.discountPercent) : undefined,
      fixedPrice: v.fixedPrice != null ? Number(v.fixedPrice) : undefined,
      bundlePrice: v.bundlePrice != null ? Number(v.bundlePrice) : undefined,
      ruleDefinition: { conditions, action },
    };
    this.ref.close(result);
  }

  cancel(): void {
    this.ref.close();
  }
}
