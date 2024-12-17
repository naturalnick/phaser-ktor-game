import { ITEM_DATABASE, ItemData } from "../types/Item";

export interface InventorySlotData {
	itemKey: string | null;
	count: number;
}

export class InventoryManager {
	private slots: InventorySlotData[];

	constructor(size: number = 10) {
		this.slots = Array(size)
			.fill(null)
			.map(() => ({
				itemKey: null,
				count: 0,
			}));
	}

	public addItem(itemKey: string, count: number = 1): boolean {
		const itemData = ITEM_DATABASE[itemKey];
		if (!itemData) return false;

		if (itemData.stackable) {
			const existingSlot = this.slots.find(
				(slot) =>
					slot.itemKey === itemKey && slot.count < itemData.maxStack
			);
			if (existingSlot) {
				const spaceInStack = itemData.maxStack - existingSlot.count;
				const amountToAdd = Math.min(count, spaceInStack);
				existingSlot.count += amountToAdd;
				count -= amountToAdd;
				if (count === 0) return true;
			}
		}

		const emptySlot = this.slots.find((slot) => slot.itemKey === null);
		if (emptySlot) {
			emptySlot.itemKey = itemKey;
			emptySlot.count = count;
			return true;
		}

		return false;
	}

	public removeItem(slotIndex: number, count: number = 1): string | null {
		const slot = this.slots[slotIndex];
		if (!slot || !slot.itemKey || slot.count < count) return null;

		const itemKey = slot.itemKey;
		slot.count -= count;

		if (slot.count <= 0) {
			slot.itemKey = null;
			slot.count = 0;
		}

		return itemKey;
	}

	public getSlots(): InventorySlotData[] {
		return this.slots;
	}

	public getItemData(slotIndex: number): ItemData | null {
		const slot = this.slots[slotIndex];
		if (slot.itemKey) {
			return ITEM_DATABASE[slot.itemKey];
		}
		return null;
	}
}
