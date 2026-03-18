import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  companyId?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'dark_culinary_token';
const USER_KEY = 'dark_culinary_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUserSnapshot(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.storage.get<string | null>(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.api.post<AuthResponse>('auth/login', { email, password }).pipe(
      tap((res) => this.handleAuthResponse(res)),
    );
  }

  loginWithPin(companyId: string, nameOrCode: string, pin: string) {
    return this.api.post<AuthResponse>('auth/pin-login', {
      companyId,
      name: nameOrCode?.trim() || undefined,
      pin,
    }).pipe(
      tap((res) => this.handleAuthResponse(res)),
    );
  }

  logout(): void {
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/customer/welcome']);
  }

  isLoggedInForCompany(companyId: string | null | undefined) {
    return this.currentUser$.pipe(
      map((user) => {
        if (!user || !companyId) {
          return false;
        }
        return user.companyId === companyId;
      }),
    );
  }

  private handleAuthResponse(res: AuthResponse): void {
    this.storage.set(TOKEN_KEY, res.access_token);
    this.storage.set(USER_KEY, res.user);
    this.currentUserSubject.next(res.user);
  }

  private loadUserFromStorage(): AuthUser | null {
    return this.storage.get<AuthUser | null>(USER_KEY);
  }
}

