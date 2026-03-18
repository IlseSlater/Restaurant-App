import { TablesService } from './tables.service';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
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
    updateTableStatus(id: string, statusDto: {
        status: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "update">>;
    assignWaiter(id: string, assignDto: {
        waiterId: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "update">>;
    clearTable(id: string, force?: string): Promise<{
        table: any;
        sessionEnded: boolean;
    }>;
    deleteTable(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TablePayload<ExtArgs>, T, "delete">>;
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
    generateAllQRData(companyId: string): Promise<any>;
}
