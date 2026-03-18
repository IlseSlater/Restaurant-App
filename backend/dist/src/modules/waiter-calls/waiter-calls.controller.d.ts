import { WaiterCallsService } from './waiter-calls.service';
export declare class WaiterCallsController {
    private readonly callService;
    constructor(callService: WaiterCallsService);
    createCall(data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "create">>;
    acknowledgeCall(id: string, data: {
        acknowledgedBy: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "update">>;
    resolveCall(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WaiterCallPayload<ExtArgs>, T, "update">>;
    getCallsByTable(tableId: string): Promise<$Public.PrismaPromise<T>>;
    getPendingCalls(companyId?: string, type?: string): Promise<$Public.PrismaPromise<T>>;
}
