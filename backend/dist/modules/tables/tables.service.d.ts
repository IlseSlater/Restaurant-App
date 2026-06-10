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
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTable(id: string): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getTableByQRCode(qrCode: string): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createTable(createDto: {
        number: number;
        qrCode?: string;
        companyId?: string;
        status?: string;
    }): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTable(id: string, updateDto: any): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTableStatus(id: string, status: string): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    assignWaiter(tableId: string, waiterId: string | null): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteTable(id: string): Promise<{
        number: number;
        id: string;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
