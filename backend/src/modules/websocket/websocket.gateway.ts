import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200',
      'https://localhost:4200',
      'http://127.0.0.1:4200',
      'https://127.0.0.1:4200',
      'https://localhost.localdomain:4200',
      'https://lvh.me:4200',
      'https://vite.lvh.me:4200',
      'https://192.168.50.204:4200',
    ],
    credentials: true,
  },
})
export class RestaurantWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RestaurantWebSocketGateway');
  private connectedClients = new Map<string, { socket: Socket; userType: string; companyId?: string }>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    // Join client to general room
    client.join('general');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove from connected clients
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { room: string; userType: string; companyId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room, userType, companyId } = data;
    
    // Leave previous rooms (safer approach)
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      // Leave specific rooms instead of using leaveAll()
      client.leave('waiters');
      client.leave('kitchen');
      client.leave('admin');
      client.leave('customers');
      client.leave('general');
      
      // Leave company-specific rooms if switching companies
      if (clientInfo.companyId && clientInfo.companyId !== companyId) {
        this.leaveCompanyRooms(client, clientInfo.companyId);
      }
    }
    
    // Join new room
    client.join(room);
    
    // Store client info
    this.connectedClients.set(client.id, { socket: client, userType, companyId });
    
    this.logger.log(`Client ${client.id} joined room: ${room} as ${userType}${companyId ? ` for company ${companyId}` : ''}`);
    
    // Notify others in the room
    client.to(room).emit('user_joined', {
      clientId: client.id,
      userType,
      companyId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join-company-rooms')
  handleJoinCompanyRooms(
    @MessageBody() data: { companyId: string; rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { companyId, rooms } = data;
    
    // Join company-specific rooms
    rooms.forEach(roomType => {
      const roomName = `${roomType}-${companyId}`;
      client.join(roomName);
      this.logger.log(`Client ${client.id} joined company room: ${roomName}`);
    });
    
    // Update client info
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.companyId = companyId;
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = data;
    client.leave(room);
    
    console.log(`Client ${client.id} left room: ${room}`);
    
    // Notify others in the room
    client.to(room).emit('user_left', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Company-scoped room management (room names must match emitToCompany: roomType-companyId)
  private leaveCompanyRooms(client: Socket, companyId: string) {
    const rooms = ['kitchen', 'bar', 'waiters', 'customer', 'admin', 'manager'];
    rooms.forEach(roomType => {
      const roomName = `${roomType}-${companyId}`;
      client.leave(roomName);
    });
  }

  // Emit to company-specific rooms
  emitToCompany(companyId: string, roomType: string, event: string, data: any) {
    const roomName = `${roomType}-${companyId}`;
    this.server.to(roomName).emit(event, data);
    this.logger.log(`Emitted ${event} to company room: ${roomName}`);
  }

  /** Emit to all clients at a table (for social activity feed). Room name: table-${tableId} */
  emitToTable(tableId: string, event: string, data: any) {
    const roomName = `table-${tableId}`;
    this.server.to(roomName).emit(event, data);
    this.logger.log(`Emitted ${event} to table room: ${roomName}`);
  }

  // Order-related events
  @SubscribeMessage('order_created')
  handleOrderCreated(
    @MessageBody() data: { order: any; tableId: string; companyId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { order, tableId, companyId } = data;
    
    if (companyId) {
      // Company-scoped broadcasting
      this.emitToCompany(companyId, 'kitchen', 'new_order', {
        order,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'waiters', 'order_created', {
        order,
        tableId,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Legacy broadcasting
      this.server.to('kitchen').emit('new_order', {
        order,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.server.to('waiters').emit('order_created', {
        order,
        tableId,
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`Order created: ${order.id} for table ${tableId}${companyId ? ` in company ${companyId}` : ''}`);
  }

  @SubscribeMessage('order_status_updated')
  handleOrderStatusUpdate(
    @MessageBody() data: { orderId: string; status: string; tableId: string; companyId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId, status, tableId, companyId } = data;
    
    if (companyId) {
      // Company-scoped broadcasting
      this.emitToCompany(companyId, 'waiters', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'kitchen', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'customer', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Legacy broadcasting
      this.server.to('waiters').emit('order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.server.to('kitchen').emit('order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.server.to(`table_${tableId}`).emit('order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`Order ${orderId} status updated to: ${status}${companyId ? ` in company ${companyId}` : ''}`);
  }

  // Table-related events
  @SubscribeMessage('table_status_updated')
  handleTableStatusUpdate(
    @MessageBody() data: { tableId: string; status: string; waiterId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tableId, status, waiterId } = data;
    
    // Broadcast to waiters
    this.server.to('waiters').emit('table_status_changed', {
      tableId,
      status,
      waiterId,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast to admin
    this.server.to('admin').emit('table_status_changed', {
      tableId,
      status,
      waiterId,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Table ${tableId} status updated to: ${status}`);
  }

  @SubscribeMessage('waiter_assigned')
  handleWaiterAssigned(
    @MessageBody() data: { tableId: string; waiterId: string; waiterName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tableId, waiterId, waiterName } = data;
    
    // Broadcast to waiters
    this.server.to('waiters').emit('waiter_assigned', {
      tableId,
      waiterId,
      waiterName,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast to admin
    this.server.to('admin').emit('waiter_assigned', {
      tableId,
      waiterId,
      waiterName,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Waiter ${waiterName} assigned to table ${tableId}`);
  }

  // Menu-related events
  @SubscribeMessage('menu_item_updated')
  handleMenuItemUpdate(
    @MessageBody() data: { menuItem: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { menuItem } = data;
    
    // Broadcast to all customers
    this.server.to('customers').emit('menu_updated', {
      menuItem,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Menu item updated: ${menuItem.name}`);
  }

  // Utility methods for broadcasting from services
  broadcastOrderUpdate(orderId: string, status: string, tableId: string, companyId?: string) {
    if (companyId) {
      this.emitToCompany(companyId, 'waiters', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'kitchen', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'customer', 'order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.server.emit('order_status_changed', {
        orderId,
        status,
        tableId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  broadcastTableUpdate(tableId: string, status: string, waiterId?: string, companyId?: string) {
    if (companyId) {
      this.emitToCompany(companyId, 'waiters', 'table_status_changed', {
        tableId,
        status,
        waiterId,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'admin', 'table_status_changed', {
        tableId,
        status,
        waiterId,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.server.emit('table_status_changed', {
        tableId,
        status,
        waiterId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  broadcastWaiterAssignment(tableId: string, waiterId: string, waiterName: string, companyId?: string) {
    if (companyId) {
      this.emitToCompany(companyId, 'waiters', 'waiter_assigned', {
        tableId,
        waiterId,
        waiterName,
        timestamp: new Date().toISOString(),
      });
      
      this.emitToCompany(companyId, 'admin', 'waiter_assigned', {
        tableId,
        waiterId,
        waiterName,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.server.emit('waiter_assigned', {
        tableId,
        waiterId,
        waiterName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Customer-specific events
  broadcastCustomerOrderUpdate(orderId: string, status: string, tableId: string, companyId: string) {
    this.emitToCompany(companyId, 'customer', 'customer_order_status_changed', {
      orderId,
      status,
      tableId,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWaiterCall(tableId: string, callType: string, message: string, companyId: string) {
    this.emitToCompany(companyId, 'waiters', 'waiter_call', {
      tableId,
      callType,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * When a CustomerSession is ended (sessionEnd set or isActive false), notify clients in the
   * customer room and force them to leave so they stop receiving push events (no zombie connections).
   */
  async notifySessionEnded(sessionId: string, reason?: string): Promise<void> {
    const roomName = `customer-${sessionId}`;
    this.server.to(roomName).emit('session_ended', {
      sessionId,
      reason: reason ?? 'SESSION_ENDED',
      timestamp: new Date().toISOString(),
    });
    const sockets = await this.server.in(roomName).fetchSockets();
    for (const socket of sockets) {
      socket.leave(roomName);
    }
    if (sockets.length > 0) {
      this.logger.log(`Session ended: ${sessionId}, ${sockets.length} client(s) removed from room ${roomName}`);
    }
  }

  /**
   * Social presence: when a new participant joins the table, everyone in the customer room
   * gets a real-time event (e.g. "John has joined the table!") for toast/vibration.
   */
  notifyParticipantJoined(
    sessionId: string,
    participant: { id: string; displayName: string; isCreator: boolean },
  ): void {
    const roomName = `customer-${sessionId}`;
    this.server.to(roomName).emit('participant_joined', {
      sessionId,
      participant,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Participant joined: ${participant.displayName} in session ${sessionId}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get clients by user type
  getClientsByUserType(userType: string): Socket[] {
    const clients: Socket[] = [];
    this.connectedClients.forEach((clientInfo, clientId) => {
      if (clientInfo.userType === userType) {
        clients.push(clientInfo.socket);
      }
    });
    return clients;
  }
}
