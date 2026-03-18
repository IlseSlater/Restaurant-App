import { MenuItem } from './menu.model';

export type SelectionType = 'SINGLE' | 'MULTIPLE';

export type ModifierVisualType = 'SLIDER' | 'TILE';

export interface ModifierOption {
  id: string;
  name: string;
  description?: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
  imageUrl?: string;
  visualType?: ModifierVisualType;
}

export interface ModifierGroup {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  selectionType: SelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number;
  sortOrder: number;
  options: ModifierOption[];
}

export interface ModifierGroupLink {
  modifierGroupId: string;
  sortOrder?: number;
  overrideRequired?: boolean;
  overrideMin?: number;
  overrideMax?: number;
}

export interface MenuItemModifierGroup extends ModifierGroup {
  overrideRequired?: boolean;
  overrideMin?: number;
  overrideMax?: number;
}

export interface BundleSlot {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
  allowedItems: MenuItem[];
}

export interface MenuItemConfiguration {
  modifierGroups: MenuItemModifierGroup[];
  bundleSlots: BundleSlot[];
}

export interface SelectedModifier {
  modifierOptionId: string;
  modifierGroupName: string;
  optionName: string;
  priceAdjustment: number;
}

export interface BundleChoice {
  bundleSlotId: string;
  chosenMenuItemId: string;
  chosenItemName: string;
  modifiers?: SelectedModifier[];
}

export interface ModifierDisplay {
  groupName: string;
  optionName: string;
  priceAdjustment: number;
}

export interface BundleChoiceDisplay {
  slotName: string;
  chosenItemName: string;
}
