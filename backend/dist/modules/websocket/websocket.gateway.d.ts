import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RestaurantWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private connectedClients;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        room: string;
        userType: string;
        companyId?: string;
    }, client: Socket): void;
    handleJoinCompanyRooms(data: {
        companyId: string;
        rooms: string[];
    }, client: Socket): void;
    handleLeaveRoom(data: {
        room: string;
    }, client: Socket): void;
    private leaveCompanyRooms;
    emitToCompany(companyId: string, roomType: string, event: string, data: any): void;
    emitToTable(tableId: string, event: string, data: any): void;
    handleOrderCreated(data: {
        order: any;
        tableId: string;
        companyId?: string;
    }, client: Socket): void;
    handleOrderStatusUpdate(data: {
        orderId: string;
        status: string;
        tableId: string;
        companyId?: string;
    }, client: Socket): void;
    handleTableStatusUpdate(data: {
        tableId: string;
        status: string;
        waiterId?: string;
    }, client: Socket): void;
    handleWaiterAssigned(data: {
        tableId: string;
        waiterId: string;
        waiterName: string;
    }, client: Socket): void;
    handleMenuItemUpdate(data: {
        menuItem: any;
    }, client: Socket): void;
    broadcastOrderUpdate(orderId: string, status: string, tableId: string, companyId?: string): void;
    broadcastTableUpdate(tableId: string, status: string, waiterId?: string, companyId?: string): void;
    broadcastWaiterAssignment(tableId: string, waiterId: string, waiterName: string, companyId?: string): void;
    broadcastCustomerOrderUpdate(orderId: string, status: string, tableId: string, companyId: string): void;
    broadcastWaiterCall(tableId: string, callType: string, message: string, companyId: string): void;
    notifySessionEnded(sessionId: string, reason?: string): Promise<void>;
    notifyParticipantJoined(sessionId: string, participant: {
        id: string;
        displayName: string;
        isCreator: boolean;
    }): void;
    getConnectedClientsCount(): number;
    getClientsByUserType(userType: string): Socket[];
}
