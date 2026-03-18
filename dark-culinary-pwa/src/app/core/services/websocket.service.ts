import { Injectable, OnDestroy, inject, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/** When opened from another device (e.g. phone), use that host for WebSocket so it connects to your dev machine. */
function getWsUrl(): string {
  const fromEnv = environment.wsUrl ?? 'http://localhost:3000';
  if (typeof window === 'undefined') return fromEnv;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return fromEnv;
  return `http://${host}:3000`;
}

type RoomMembership =
  | { room: string; companyId?: never; rooms?: never }
  | { room?: never; companyId: string; rooms: string[] };

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly disconnect$ = new Subject<void>();
  private readonly joinedRooms: RoomMembership[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private readonly ngZone = inject(NgZone);

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(getWsUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.rejoinAllRooms();
    });

    this.socket.on('disconnect', (reason) => {
      this.disconnect$.next();
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;
    });

    this.socket.io.on('reconnect', () => {
      this.rejoinAllRooms();
    });
  }

  private rejoinAllRooms(): void {
    if (!this.socket?.connected) return;
    for (const m of this.joinedRooms) {
      if ('room' in m && m.room) {
        this.socket.emit('join_room', { room: m.room, userType: 'generic' });
      }
      if ('companyId' in m && m.companyId && m.rooms?.length) {
        this.socket.emit('join-company-rooms', {
          companyId: m.companyId,
          rooms: m.rooms,
        });
      }
    }
  }

  joinRoom(room: string): void {
    this.socket?.emit('join_room', { room, userType: 'generic' });
    if (!this.joinedRooms.some((m) => 'room' in m && m.room === room)) {
      this.joinedRooms.push({ room });
    }
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave_room', { room });
    const idx = this.joinedRooms.findIndex((m) => 'room' in m && m.room === room);
    if (idx !== -1) this.joinedRooms.splice(idx, 1);
  }

  joinCompanyRooms(companyId: string, rooms: string[]): void {
    this.socket?.emit('join-company-rooms', { companyId, rooms });
    const existing = this.joinedRooms.findIndex(
      (m) => 'companyId' in m && m.companyId === companyId
    );
    const entry: RoomMembership = { companyId, rooms };
    if (existing !== -1) {
      this.joinedRooms[existing] = entry;
    } else {
      this.joinedRooms.push(entry);
    }
  }

  on<T>(event: string): Observable<T> {
    const subject = new Subject<T>();
    this.socket?.on(event, (payload: T) =>
      // Ensure WebSocket callbacks run inside Angular's zone so change detection works
      this.ngZone.run(() => subject.next(payload)),
    );
    return subject.asObservable();
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedRooms.length = 0;
    this.disconnect$.next();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.disconnect$.complete();
  }
}
