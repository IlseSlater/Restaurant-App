import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ModifierGroup,
  ModifierOption,
  MenuItemConfiguration,
} from '../models/modifier.model';

export interface ActiveSpecial {
  id: string;
  name: string;
  description: string | null;
  specialType: string;
  appliedPrice?: number;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  chargePerUnit?: number;
  unitType?: string;
  totalCharge?: number;
  matchedItemIds?: string[];
  message?: string;
}

export type SpecialType = 'TIME_BASED' | 'CONDITIONAL' | 'MULTI_SLOT' | 'AUTO_APPENDED';

export interface SpecialDto {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  specialType: SpecialType;
  isActive: boolean;
  startTime?: string | null;
  endTime?: string | null;
  daysOfWeek?: number[];
  triggerCategory?: string | null;
  triggerItemIds?: string[];
  requiredSlots?: Record<string, number> | null;
  slotDefinitions?: unknown;
  chargePerUnit?: number | null;
  unitType?: string | null;
  discountPercent?: number | null;
  fixedPrice?: number | null;
  bundlePrice?: number | null;
  ruleDefinition?: unknown;
  specialItems?: Array<{ id: string; menuItemId: string; menuItem?: { id: string; name: string }; isRequired: boolean; sortOrder: number }>;
}

export interface CreateSpecialDto {
  companyId: string;
  name: string;
  description?: string;
  specialType: SpecialType;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  triggerCategory?: string;
  triggerItemIds?: string[];
  requiredSlots?: Record<string, number>;
  slotDefinitions?: unknown;
  chargePerUnit?: number;
  unitType?: string;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  ruleDefinition?: unknown;
}

export interface UpdateSpecialDto {
  name?: string;
  description?: string;
  specialType?: SpecialType;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  triggerCategory?: string;
  triggerItemIds?: string[];
  requiredSlots?: Record<string, number>;
  slotDefinitions?: unknown;
  chargePerUnit?: number;
  unitType?: string;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  ruleDefinition?: unknown;
}

/** When opened from another device (e.g. phone), use that host for API so requests hit your dev machine. */
function getApiBaseUrl(): string {
  const fromEnv = environment.apiUrl ?? 'http://localhost:3000';
  if (typeof window === 'undefined') return fromEnv;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return fromEnv;
  return `http://${host}:3000`;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = getApiBaseUrl();

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.buildUrl(path);
    const httpParams = this.buildParams(params);
    return this.http.get<T>(url, { params: httpParams });
  }

  post<T>(path: string, body: unknown, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.buildUrl(path);
    const httpParams = this.buildParams(params);
    return this.http.post<T>(url, body, { params: httpParams });
  }

  put<T>(path: string, body: unknown, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.buildUrl(path);
    const httpParams = this.buildParams(params);
    return this.http.put<T>(url, body, { params: httpParams });
  }

  patch<T>(path: string, body: unknown, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.buildUrl(path);
    const httpParams = this.buildParams(params);
    return this.http.patch<T>(url, body, { params: httpParams });
  }

  delete<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.buildUrl(path);
    const httpParams = this.buildParams(params);
    return this.http.delete<T>(url, { params: httpParams });
  }

  // --- Modifiers API ---

  getMenuItemConfiguration(menuItemId: string): Observable<MenuItemConfiguration> {
    return this.get<MenuItemConfiguration>(`modifiers/menu/${menuItemId}/configuration`);
  }

  getModifierGroups(companyId: string): Observable<ModifierGroup[]> {
    return this.get<ModifierGroup[]>('modifiers/groups', { companyId });
  }

  getModifierGroup(id: string): Observable<ModifierGroup> {
    return this.get<ModifierGroup>(`modifiers/groups/${id}`);
  }

  createModifierGroup(body: {
    companyId: string;
    name: string;
    description?: string;
    selectionType?: 'SINGLE' | 'MULTIPLE';
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
    options?: Array<{
      name: string;
      description?: string;
      priceAdjustment?: number;
      isDefault?: boolean;
      isAvailable?: boolean;
      sortOrder?: number;
    }>;
  }): Observable<ModifierGroup> {
    return this.post<ModifierGroup>('modifiers/groups', body);
  }

  updateModifierGroup(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      selectionType: 'SINGLE' | 'MULTIPLE';
      isRequired: boolean;
      minSelections: number;
      maxSelections: number;
      sortOrder: number;
    }>
  ): Observable<ModifierGroup> {
    return this.put<ModifierGroup>(`modifiers/groups/${id}`, body);
  }

  deleteModifierGroup(id: string): Observable<void> {
    return this.delete<void>(`modifiers/groups/${id}`);
  }

  addModifierOption(
    groupId: string,
    body: {
      name: string;
      description?: string;
      priceAdjustment?: number;
      isDefault?: boolean;
      isAvailable?: boolean;
      sortOrder?: number;
    }
  ): Observable<ModifierOption> {
    return this.post<ModifierOption>(`modifiers/groups/${groupId}/options`, body);
  }

  updateModifierOption(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      priceAdjustment: number;
      isDefault: boolean;
      isAvailable: boolean;
      sortOrder: number;
    }>
  ): Observable<ModifierOption> {
    return this.put<ModifierOption>(`modifiers/options/${id}`, body);
  }

  deleteModifierOption(id: string): Observable<void> {
    return this.delete<void>(`modifiers/options/${id}`);
  }

  linkModifierGroupToMenuItem(
    menuItemId: string,
    body: { modifierGroupId: string; sortOrder?: number; overrideRequired?: boolean; overrideMin?: number; overrideMax?: number }
  ): Observable<unknown> {
    return this.post(`modifiers/menu/${menuItemId}/modifier-groups`, body);
  }

  unlinkModifierGroupFromMenuItem(menuItemId: string, groupId: string): Observable<void> {
    return this.delete<void>(`modifiers/menu/${menuItemId}/modifier-groups/${groupId}`);
  }

  createBundleSlot(
    menuItemId: string,
    body: { name: string; description?: string; isRequired?: boolean; sortOrder?: number; allowedMenuItemIds?: string[] }
  ): Observable<unknown> {
    return this.post(`modifiers/menu/${menuItemId}/bundle-slots`, body);
  }

  updateBundleSlot(
    slotId: string,
    body: Partial<{ name: string; description: string; isRequired: boolean; sortOrder: number; allowedMenuItemIds: string[] }>
  ): Observable<unknown> {
    return this.put(`modifiers/bundles/slots/${slotId}`, body);
  }

  deleteBundleSlot(slotId: string): Observable<void> {
    return this.delete<void>(`modifiers/bundles/slots/${slotId}`);
  }

  // --- Specials API ---

  evaluateSpecials(body: {
    companyId: string;
    tableId?: string;
    guestCount?: number;
    cartItems: Array<{ menuItemId: string; quantity: number; category?: string; price?: number }>;
  }): Observable<ActiveSpecial[]> {
    return this.post<ActiveSpecial[]>('specials/evaluate', body);
  }

  getSpecials(companyId: string, activeOnly?: boolean): Observable<SpecialDto[]> {
    return this.get<SpecialDto[]>('specials', { companyId, ...(activeOnly !== undefined && { activeOnly: String(activeOnly) }) });
  }

  getSpecial(id: string): Observable<SpecialDto> {
    return this.get<SpecialDto>(`specials/${id}`);
  }

  createSpecial(body: CreateSpecialDto): Observable<SpecialDto> {
    return this.post<SpecialDto>('specials', body);
  }

  updateSpecial(id: string, body: UpdateSpecialDto): Observable<SpecialDto> {
    return this.put<SpecialDto>(`specials/${id}`, body);
  }

  deleteSpecial(id: string): Observable<void> {
    return this.delete<void>(`specials/${id}`);
  }

  addSpecialItem(specialId: string, body: { menuItemId: string; isRequired?: boolean; sortOrder?: number }): Observable<unknown> {
    return this.post(`specials/${specialId}/items`, body);
  }

  removeSpecialItem(specialId: string, menuItemId: string): Observable<void> {
    return this.delete<void>(`specials/${specialId}/items/${menuItemId}`);
  }

  private buildUrl(path: string): string {
    const trimmedBase = this.baseUrl.replace(/\/+$/, '');
    const trimmedPath = path.replace(/^\/+/, '');
    return `${trimmedBase}/api/${trimmedPath}`;
  }

  private buildParams(params?: Record<string, string | number | boolean | undefined>): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}

