import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getAllMenuItems(companyId?: string): Promise<$Public.PrismaPromise<T>>;
    getCategories(): Promise<unknown[]>;
    getMenuItem(id: string): Promise<any>;
    createMenuItem(createDto: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "create">>;
    updateMenuItem(id: string, updateDto: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "update">>;
    deleteMenuItem(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$MenuItemPayload<ExtArgs>, T, "delete">>;
}
