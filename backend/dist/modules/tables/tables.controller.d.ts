import { TablesService } from './tables.service';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    getAllTables(companyId?: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    }[]>;
    getTable(id: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    } | null>;
    getTableByQRCode(qrCode: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
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
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    }>;
    updateTable(id: string, updateDto: any): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    }>;
    updateTableStatus(id: string, statusDto: {
        status: string;
    }): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    }>;
    assignWaiter(id: string, assignDto: {
        waiterId: string;
    }): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
    }>;
    clearTable(id: string, force?: string): Promise<{
        table: any;
        sessionEnded: boolean;
    }>;
    deleteTable(id: string): Promise<{
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        qrCode: string;
        status: import(".prisma/client").$Enums.TableStatus;
        waiterId: string | null;
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
