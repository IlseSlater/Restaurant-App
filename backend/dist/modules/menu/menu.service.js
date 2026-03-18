"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let MenuService = class MenuService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async getAllMenuItems(companyId) {
        const whereClause = companyId ? { companyId } : {};
        const items = await this.prisma.menuItem.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
        console.log(`Returning ${items.length} menu items${companyId ? ` for company ${companyId}` : ' (all companies)'}`);
        return items;
    }
    async getCategories() {
        const categories = await this.prisma.menuItem.findMany();
        return [...new Set(categories.map(item => item.category))];
    }
    async getMenuItem(id) {
        return this.prisma.menuItem.findUnique({
            where: { id },
        });
    }
    async createMenuItem(createDto) {
        const companyId = createDto.companyId;
        if (!companyId) {
            throw new Error('companyId is required to create a menu item');
        }
        const prepMins = createDto.prepTimeMin ?? createDto.prepTime;
        const menuItem = await this.prisma.menuItem.create({
            data: {
                name: createDto.name,
                description: createDto.description,
                price: createDto.price,
                category: createDto.category,
                imageUrl: createDto.imageUrl,
                companyId,
                isAvailable: createDto.isAvailable ?? true,
                preparationTime: prepMins,
                isBundle: createDto.isBundle ?? false,
            },
        });
        if (createDto.companyId) {
            this.webSocketGateway.server.to(`admin-${createDto.companyId}`).emit('menu_item_created', {
                menuItem,
                timestamp: new Date().toISOString(),
            });
            this.webSocketGateway.server.to(`customer-${createDto.companyId}`).emit('menu_updated', {
                menuItem,
                action: 'created',
                timestamp: new Date().toISOString(),
            });
        }
        console.log(`✅ Menu item created: ${menuItem.name} (Company: ${createDto.companyId || 'N/A'})`);
        return menuItem;
    }
    async updateMenuItem(id, updateDto) {
        const { id: _ignoreId, companyId: _ignoreCompanyId, available, prepTimeMin, prepTime, preparationTime, ...rest } = updateDto ?? {};
        const data = { ...rest };
        if (typeof available === 'boolean') {
            data.isAvailable = available;
        }
        const prepMins = prepTimeMin ??
            prepTime ??
            preparationTime ??
            undefined;
        if (prepMins !== undefined) {
            data.preparationTime = prepMins;
        }
        const menuItem = await this.prisma.menuItem.update({
            where: { id },
            data,
        });
        if (menuItem.companyId) {
            this.webSocketGateway.server.to(`admin-${menuItem.companyId}`).emit('menu_item_updated', {
                menuItem,
                timestamp: new Date().toISOString(),
            });
            this.webSocketGateway.server.to(`customer-${menuItem.companyId}`).emit('menu_updated', {
                menuItem,
                action: 'updated',
                timestamp: new Date().toISOString(),
            });
        }
        console.log(`✅ Menu item updated: ${menuItem.name} (Company: ${menuItem.companyId || 'N/A'})`);
        return menuItem;
    }
    async deleteMenuItem(id) {
        const menuItem = await this.prisma.menuItem.findUnique({ where: { id } });
        const deletedItem = await this.prisma.menuItem.delete({
            where: { id },
        });
        if (menuItem?.companyId) {
            this.webSocketGateway.server.to(`admin-${menuItem.companyId}`).emit('menu_item_deleted', {
                menuItemId: id,
                menuItem: deletedItem,
                timestamp: new Date().toISOString(),
            });
            this.webSocketGateway.server.to(`customer-${menuItem.companyId}`).emit('menu_updated', {
                menuItemId: id,
                action: 'deleted',
                timestamp: new Date().toISOString(),
            });
        }
        console.log(`✅ Menu item deleted: ${menuItem?.name || id} (Company: ${menuItem?.companyId || 'N/A'})`);
        return deletedItem;
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], MenuService);
//# sourceMappingURL=menu.service.js.map