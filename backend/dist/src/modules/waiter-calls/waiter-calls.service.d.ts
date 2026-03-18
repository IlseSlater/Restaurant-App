import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class WaiterCallsService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    createCall(data: {
        tableId: string;
        customerSessionId: string;
        callType: string;
        message?: string;
        companyId?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "create">>;
    acknowledgeCall(callId: string, acknowledgedBy: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "update">>;
    resolveCall(callId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "update">>;
    getCallsByTable(tableId: string): Promise<$Public.PrismaPromise<T>>;
    getPendingCalls(companyId?: string, type?: string): Promise<$Public.PrismaPromise<T>>;
}
