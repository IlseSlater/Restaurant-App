import { TablesService } from './tables.service';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    getAllTables(companyId?: string): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTable(id: string): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getTableByQRCode(qrCode: string): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
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
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTable(id: string, updateDto: any): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTableStatus(id: string, statusDto: {
        status: string;
    }): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    assignWaiter(id: string, assignDto: {
        waiterId: string;
    }): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    clearTable(id: string, force?: string): Promise<{
        table: any;
        sessionEnded: boolean;
    }>;
    deleteTable(id: string): Promise<{
        number: number;
        companyId: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
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
    generateAllQRData(companyId: string): Promise<{
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
