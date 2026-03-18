import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway
  ) {}

  async getAllMenuItems(companyId?: string) {
    const whereClause: any = companyId ? { companyId } : {};
    
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

  async getMenuItem(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async createMenuItem(createDto: {
    name: string;
    description?: string;
    price: number;
    category: string;
    imageUrl?: string;
    companyId?: string;
    isAvailable?: boolean;
    prepTimeMin?: number;
    prepTime?: number;
    isBundle?: boolean;
  }) {
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

    // Broadcast menu item creation to all connected clients
    if (createDto.companyId) {
      this.webSocketGateway.server.to(`admin-${createDto.companyId}`).emit('menu_item_created', {
        menuItem,
        timestamp: new Date().toISOString(),
      });
      
      // Also notify customer rooms for this company
      this.webSocketGateway.server.to(`customer-${createDto.companyId}`).emit('menu_updated', {
        menuItem,
        action: 'created',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Menu item created: ${menuItem.name} (Company: ${createDto.companyId || 'N/A'})`);
    
    return menuItem;
  }

  async updateMenuItem(id: string, updateDto: any) {
  // Never allow changing primary key or company ownership via the payload
  const {
    id: _ignoreId,
    companyId: _ignoreCompanyId,
    available,        // legacy / FE flag
    prepTimeMin,
    prepTime,
    preparationTime,
    ...rest
  } = updateDto ?? {};

  const data: any = { ...rest };

  // Normalise availability flag – frontend may send `available` or `isAvailable`
  if (typeof available === 'boolean') {
    data.isAvailable = available;
  }

  // Normalise preparation time minutes
  const prepMins =
    prepTimeMin ??
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

  // Broadcast menu item update to all connected clients
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

  async deleteMenuItem(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id } });
    
    const deletedItem = await this.prisma.menuItem.delete({
      where: { id },
    });

    // Broadcast menu item deletion to all connected clients
    if (menuItem?.companyId) {
      this.webSocketGateway.server.to(`admin-${menuItem.companyId}`).emit('menu_item_deleted', {
        menuItemId: id,
        menuItem: deletedItem,
        timestamp: new Date().toISOString(),
      });
      
      // Also notify customer rooms for this company
      this.webSocketGateway.server.to(`customer-${menuItem.companyId}`).emit('menu_updated', {
        menuItemId: id,
        action: 'deleted',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Menu item deleted: ${menuItem?.name || id} (Company: ${menuItem?.companyId || 'N/A'})`);
    
    return deletedItem;
  }
}
