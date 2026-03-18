"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantWebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let RestaurantWebSocketGateway = class RestaurantWebSocketGateway {
    constructor() {
        this.logger = new common_1.Logger('RestaurantWebSocketGateway');
        this.connectedClients = new Map();
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway Initialized');
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        client.join('general');
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    handleJoinRoom(data, client) {
        const { room, userType, companyId } = data;
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            client.leave('waiters');
            client.leave('kitchen');
            client.leave('admin');
            client.leave('customers');
            client.leave('general');
            if (clientInfo.companyId && clientInfo.companyId !== companyId) {
                this.leaveCompanyRooms(client, clientInfo.companyId);
            }
        }
        client.join(room);
        this.connectedClients.set(client.id, { socket: client, userType, companyId });
        this.logger.log(`Client ${client.id} joined room: ${room} as ${userType}${companyId ? ` for company ${companyId}` : ''}`);
        client.to(room).emit('user_joined', {
            clientId: client.id,
            userType,
            companyId,
            timestamp: new Date().toISOString(),
        });
    }
    handleJoinCompanyRooms(data, client) {
        const { companyId, rooms } = data;
        rooms.forEach(roomType => {
            const roomName = `${roomType}-${companyId}`;
            client.join(roomName);
            this.logger.log(`Client ${client.id} joined company room: ${roomName}`);
        });
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            clientInfo.companyId = companyId;
        }
    }
    handleLeaveRoom(data, client) {
        const { room } = data;
        client.leave(room);
        console.log(`Client ${client.id} left room: ${room}`);
        client.to(room).emit('user_left', {
            clientId: client.id,
            timestamp: new Date().toISOString(),
        });
    }
    leaveCompanyRooms(client, companyId) {
        const rooms = ['kitchen', 'bar', 'waiters', 'customer', 'admin', 'manager'];
        rooms.forEach(roomType => {
            const roomName = `${roomType}-${companyId}`;
            client.leave(roomName);
        });
    }
    emitToCompany(companyId, roomType, event, data) {
        const roomName = `${roomType}-${companyId}`;
        this.server.to(roomName).emit(event, data);
        this.logger.log(`Emitted ${event} to company room: ${roomName}`);
    }
    emitToTable(tableId, event, data) {
        const roomName = `table-${tableId}`;
        this.server.to(roomName).emit(event, data);
        this.logger.log(`Emitted ${event} to table room: ${roomName}`);
    }
    handleOrderCreated(data, client) {
        const { order, tableId, companyId } = data;
        if (companyId) {
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
        }
        else {
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
    handleOrderStatusUpdate(data, client) {
        const { orderId, status, tableId, companyId } = data;
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
        }
        else {
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
    handleTableStatusUpdate(data, client) {
        const { tableId, status, waiterId } = data;
        this.server.to('waiters').emit('table_status_changed', {
            tableId,
            status,
            waiterId,
            timestamp: new Date().toISOString(),
        });
        this.server.to('admin').emit('table_status_changed', {
            tableId,
            status,
            waiterId,
            timestamp: new Date().toISOString(),
        });
        console.log(`Table ${tableId} status updated to: ${status}`);
    }
    handleWaiterAssigned(data, client) {
        const { tableId, waiterId, waiterName } = data;
        this.server.to('waiters').emit('waiter_assigned', {
            tableId,
            waiterId,
            waiterName,
            timestamp: new Date().toISOString(),
        });
        this.server.to('admin').emit('waiter_assigned', {
            tableId,
            waiterId,
            waiterName,
            timestamp: new Date().toISOString(),
        });
        console.log(`Waiter ${waiterName} assigned to table ${tableId}`);
    }
    handleMenuItemUpdate(data, client) {
        const { menuItem } = data;
        this.server.to('customers').emit('menu_updated', {
            menuItem,
            timestamp: new Date().toISOString(),
        });
        console.log(`Menu item updated: ${menuItem.name}`);
    }
    broadcastOrderUpdate(orderId, status, tableId, companyId) {
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
        }
        else {
            this.server.emit('order_status_changed', {
                orderId,
                status,
                tableId,
                timestamp: new Date().toISOString(),
            });
        }
    }
    broadcastTableUpdate(tableId, status, waiterId, companyId) {
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
        }
        else {
            this.server.emit('table_status_changed', {
                tableId,
                status,
                waiterId,
                timestamp: new Date().toISOString(),
            });
        }
    }
    broadcastWaiterAssignment(tableId, waiterId, waiterName, companyId) {
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
        }
        else {
            this.server.emit('waiter_assigned', {
                tableId,
                waiterId,
                waiterName,
                timestamp: new Date().toISOString(),
            });
        }
    }
    broadcastCustomerOrderUpdate(orderId, status, tableId, companyId) {
        this.emitToCompany(companyId, 'customer', 'customer_order_status_changed', {
            orderId,
            status,
            tableId,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastWaiterCall(tableId, callType, message, companyId) {
        this.emitToCompany(companyId, 'waiters', 'waiter_call', {
            tableId,
            callType,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    async notifySessionEnded(sessionId, reason) {
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
    notifyParticipantJoined(sessionId, participant) {
        const roomName = `customer-${sessionId}`;
        this.server.to(roomName).emit('participant_joined', {
            sessionId,
            participant,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Participant joined: ${participant.displayName} in session ${sessionId}`);
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    getClientsByUserType(userType) {
        const clients = [];
        this.connectedClients.forEach((clientInfo, clientId) => {
            if (clientInfo.userType === userType) {
                clients.push(clientInfo.socket);
            }
        });
        return clients;
    }
};
exports.RestaurantWebSocketGateway = RestaurantWebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RestaurantWebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-company-rooms'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleJoinCompanyRooms", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order_created'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleOrderCreated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order_status_updated'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleOrderStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('table_status_updated'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleTableStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('waiter_assigned'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleWaiterAssigned", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('menu_item_updated'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RestaurantWebSocketGateway.prototype, "handleMenuItemUpdate", null);
exports.RestaurantWebSocketGateway = RestaurantWebSocketGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:4200'],
            credentials: true,
        },
    })
], RestaurantWebSocketGateway);
//# sourceMappingURL=websocket.gateway.js.map