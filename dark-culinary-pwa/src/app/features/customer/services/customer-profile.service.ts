import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError, throwError, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { StorageService } from '../../../core/services/storage.service';
import { CustomerProfile } from '../../../core/models/customer-profile.model';
import { CustomerSession } from '../../../core/models/customer-session.model';
import { CustomerSessionService } from './customer-session.service';

const PROFILE_KEY = 'dark_culinary_customer_profile';
const DEVICE_ID_KEY = 'dark_culinary_device_id';

@Injectable({
  providedIn: 'root',
})
export class CustomerProfileService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly sessionService = inject(CustomerSessionService);

  private readonly profileSubject = new BehaviorSubject<CustomerProfile | null>(this.loadFromStorage());
  readonly profile$ = this.profileSubject.asObservable();

  getProfileSnapshot(): CustomerProfile | null {
    return this.profileSubject.value;
  }

  getDeviceId(): string {
    const existing = this.storage.get<string>(DEVICE_ID_KEY);
    if (existing?.trim()) {
      return existing.trim();
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `device-${Date.now()}`;
    this.storage.set(DEVICE_ID_KEY, id);
    return id;
  }

  saveProfile(profile: CustomerProfile): void {
    const next: CustomerProfile = {
      ...profile,
      customerName: profile.customerName.trim(),
      phoneNumber: profile.phoneNumber?.trim() || undefined,
      allergies: profile.allergies?.trim() || undefined,
      deviceId: profile.deviceId ?? this.getDeviceId(),
      updatedAt: new Date().toISOString(),
    };
    this.storage.set(PROFILE_KEY, next);
    this.profileSubject.next(next);
  }

  /** Merge session + stored profile (stored profile wins for editable fields). */
  resolveProfile(session?: CustomerSession | null): CustomerProfile | null {
    const stored = this.profileSubject.value;
    if (stored?.customerName) {
      return {
        ...stored,
        customerName: stored.customerName,
        phoneNumber: stored.phoneNumber ?? session?.phoneNumber,
        dietaryPreferences: stored.dietaryPreferences ?? session?.dietaryPreferences,
        allergies: stored.allergies ?? session?.allergies,
      };
    }
    if (session?.customerName) {
      return {
        customerName: session.customerName,
        phoneNumber: session.phoneNumber,
        dietaryPreferences: session.dietaryPreferences,
        allergies: session.allergies,
        deviceId: this.getDeviceId(),
      };
    }
    return null;
  }

  syncToActiveSession(profile: CustomerProfile): Observable<{ synced: boolean }> {
    this.saveProfile(profile);

    const session = this.sessionService.currentSessionSnapshot;
    if (!session?.id) {
      return of({ synced: false });
    }

    this.sessionService.patchLocalSession({
      ...session,
      customerName: profile.customerName,
      phoneNumber: profile.phoneNumber,
      dietaryPreferences: profile.dietaryPreferences,
      allergies: profile.allergies,
    });

    return this.api
      .put<CustomerSession & { participants?: CustomerSession['participants'] }>(
        `customer-sessions/${session.id}/profile`,
        {
          customerName: profile.customerName,
          phoneNumber: profile.phoneNumber,
          dietaryPreferences: profile.dietaryPreferences ?? [],
          allergies: profile.allergies,
          participantId: session.participantId,
        },
      )
      .pipe(
        tap((updated) => {
          const current = this.sessionService.currentSessionSnapshot;
          if (current?.id === session.id) {
            this.sessionService.patchLocalSession({
              ...current,
              customerName: profile.customerName,
              phoneNumber: profile.phoneNumber,
              dietaryPreferences: profile.dietaryPreferences,
              allergies: profile.allergies,
              participants: updated.participants ?? current.participants,
            });
          }
        }),
        map(() => ({ synced: true })),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            const serverMessage =
              typeof err.error === 'object' && err.error && 'message' in err.error
                ? String((err.error as { message?: string }).message ?? '')
                : '';
            if (serverMessage.includes('Cannot PUT') || serverMessage.includes('Cannot POST')) {
              return throwError(
                () =>
                  new Error(
                    'Profile saved on this device, but the server endpoint is missing. Restart the backend (npm run start:run in backend/).',
                  ),
              );
            }
            return throwError(
              () =>
                new Error(
                  serverMessage ||
                    'Profile saved on this device. Start or rejoin a table session to sync with the server.',
                ),
            );
          }
          return throwError(() => err);
        }),
      );
  }

  private loadFromStorage(): CustomerProfile | null {
    const raw = this.storage.get<CustomerProfile | null>(PROFILE_KEY);
    if (!raw?.customerName?.trim()) {
      return null;
    }
    return {
      ...raw,
      customerName: raw.customerName.trim(),
      deviceId: raw.deviceId ?? this.getDeviceId(),
    };
  }
}
