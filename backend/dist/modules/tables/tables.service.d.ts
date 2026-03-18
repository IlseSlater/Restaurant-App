import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { CustomerSessionsService } from '../customer-sessions/customer-sessions.service';
export declare class TablesService {
    private prisma;
    private webSocketGateway;
    private customerSessionsService;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway, customerSessionsService: CustomerSessionsService);
    getAllTables(companyId?: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }[]>;
    getTable(id: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    } | null>;
    getTableByQRCode(qrCode: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    createTable(createDto: {
        number: number;
        qrCode?: string;
        companyId?: string;
        status?: string;
    }): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    updateTable(id: string, updateDto: any): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    updateTableStatus(id: string, status: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    assignWaiter(tableId: string, waiterId: string | null): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    deleteTable(id: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        qrCode: string;
        waiterId: string | null;
    }>;
    clearTable(tableId: string, force?: boolean): Promise<{
        table: any;
        sessionEnded: boolean;
    }>;
    generateQRData(companyId: string, tableId: string): Promise<{
        companyId: string;
        companyGuid: string;
        companyName: string;
        companySlug: string;
        tableId: string;
        tableNumber: number;
        expectedLocation: {
            lat: number;
            lng: number;
            radius: number;
        } | null;
        scanUrl: string;
        qrCodeData: string;
        timestamp: string;
    }>;
    generateAllQRDataForCompany(companyId: string): Promise<{
        companyId: string;
        companyGuid: string;
        companyName: string;
        companySlug: string;
        tableId: string;
        tableNumber: number;
        expectedLocation: {
            lat: number;
            lng: number;
            radius: number;
        } | null;
        scanUrl: string;
        qrCodeData: string;
        timestamp: string;
    }[]>;
}
