import { CustomerSessionsService } from './customer-sessions.service';
export declare class CustomerSessionsController {
    private readonly sessionService;
    constructor(sessionService: CustomerSessionsService);
    createSession(data: any): Promise<$Utils.JsPromise<R>>;
    getScanStatus(tableId: string, companyId?: string): Promise<{
        hasActiveSession: boolean;
        tableId: any;
        tableNumber: any;
        companyId: any;
        sessionId?: undefined;
        participants?: undefined;
    } | {
        hasActiveSession: boolean;
        sessionId: any;
        tableId: any;
        tableNumber: any;
        companyId: any;
        participants: any;
    }>;
    joinSession(sessionId: string, body: {
        displayName?: string;
        participantId?: string;
        phoneNumber?: string;
        deviceId?: string;
    }): Promise<{
        participant: $Result.GetResult<import(".prisma/client").Prisma.$ParticipantPayload<ExtArgs>, T, "create">;
        sessionId: string;
    }>;
    getSession(id: string): Promise<any>;
    getPaymentStatus(id: string): Promise<{
        participants: {
            participantId: string;
            displayName: string;
            paid: boolean;
            paidBy?: string;
        }[];
    }>;
    updateActivity(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerSessionPayload<ExtArgs>, T, "update">>;
    endSession(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerSessionPayload<ExtArgs>, T, "update">>;
    getSessionsByTable(tableId: string): Promise<$Public.PrismaPromise<T>>;
    getSessionByPhone(phoneNumber: string): Promise<any>;
    endSessionWithPayment(id: string, data: {
        paidBy: string;
    }): Promise<void>;
    endPreviousSessions(data: {
        phoneNumber: string;
        newCompanyId: string;
    }): Promise<void>;
    expireInactiveSessions(): Promise<any>;
    validateLocation(id: string, data: {
        lat: number;
        lng: number;
    }): Promise<boolean>;
}
