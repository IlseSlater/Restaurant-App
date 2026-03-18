import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { CustomerSessionsService } from '../customer-sessions/customer-sessions.service';
export declare class TablesService {
    private prisma;
    private webSocketGateway;
    private customerSessionsService;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway, customerSessionsService: CustomerSessionsService);
    getAllTables(companyId?: string): Promise<$Public.PrismaPromise<T>>;
    getTable(id: string): Promise<any>;
    getTableByQRCode(qrCode: string): Promise<any>;
    createTable(createDto: {
        number: number;
        qrCode?: string;
        companyId?: string;
        status?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "create">>;
    updateTable(id: string, updateDto: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "update">>;
    updateTableStatus(id: string, status: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "update">>;
    assignWaiter(tableId: string, waiterId: string | null): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "update">>;
    deleteTable(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "delete">>;
    clearTable(tableId: string, force?: boolean): Promise<{
        table: any;
        sessionEnded: boolean;
    }>;
    generateQRData(companyId: string, tableId: string): Promise<{
        companyId: any;
        companyGuid: any;
        companyName: any;
        companySlug: any;
        tableId: any;
        tableNumber: any;
        expectedLocation: {
            lat: number;
            lng: number;
            radius: any;
        } | null;
        scanUrl: string;
        qrCodeData: string;
        timestamp: string;
    }>;
    generateAllQRDataForCompany(companyId: string): Promise<any>;
}
