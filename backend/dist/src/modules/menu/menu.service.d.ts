import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class MenuService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getAllMenuItems(companyId?: string): Promise<$Public.PrismaPromise<T>>;
    getCategories(): Promise<unknown[]>;
    getMenuItem(id: string): Promise<any>;
    createMenuItem(createDto: {
        name: string;
        description?: string;
        price: number;
        category: string;
        imageUrl?: string;
        companyId?: string;
        isAvailable?: boolean;
        prepTimeMin?: number;
        prepTime?: number;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "create">>;
    updateMenuItem(id: string, updateDto: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "update">>;
    deleteMenuItem(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "delete">>;
}
