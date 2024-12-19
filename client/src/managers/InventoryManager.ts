import { Scene } from "phaser";
import { ITEM_DATABASE, ItemData } from "../types/Item";

export interface InventorySlotData {
	itemKey: string | null;
	count: number;
}

export class InventoryManager {
	private scene: Scene;
	public id: string;
	private slots: InventorySlotData[];

	constructor(size: number = 10) {
		this.id = Math.floor(Math.random() * 100).toString();
		this.slots = Array(size)
			.fill(null)
			.map(() => ({
				itemKey: null,
				count: 0,
			}));
	}

	public setItem(slotIndex: number, itemKey: string, count: number): void {
		const slot = this.slots[slotIndex];
		slot.itemKey = itemKey;
		slot.count = count;
	}

	public addItem(itemKey: string, count: number = 1): boolean {
		const itemData = ITEM_DATABASE[itemKey];
		if (!itemData) return false;

		if (itemData.maxStack > 1) {
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

	public moveItems(slotIndexFrom: number, slotIndexTo: number): void {
		// Validate indices
		if (
			slotIndexFrom < 0 ||
			slotIndexFrom >= this.slots.length ||
			slotIndexTo < 0 ||
			slotIndexTo >= this.slots.length ||
			slotIndexFrom === slotIndexTo
		) {
			return;
		}

		const fromSlot = this.slots[slotIndexFrom];
		const toSlot = this.slots[slotIndexTo];

		// If source slot is empty, nothing to move
		if (!fromSlot.itemKey) {
			return;
		}

		// If destination slot is empty, simply move the item
		if (!toSlot.itemKey) {
			toSlot.itemKey = fromSlot.itemKey;
			toSlot.count = fromSlot.count;
			fromSlot.itemKey = null;
			fromSlot.count = 0;
			return;
		}

		// If both slots have items
		if (fromSlot.itemKey === toSlot.itemKey) {
			// Same item type - attempt to stack
			const itemData = ITEM_DATABASE[toSlot.itemKey];
			if (itemData.maxStack > 1) {
				const spaceInStack = itemData.maxStack - toSlot.count;
				const amountToMove = Math.min(fromSlot.count, spaceInStack);

				if (amountToMove > 0) {
					toSlot.count += amountToMove;
					fromSlot.count -= amountToMove;

					if (fromSlot.count <= 0) {
						fromSlot.itemKey = null;
						fromSlot.count = 0;
					}
					return;
				}
			}
		}

		// Different items or unable to stack - swap them
		const tempItemKey = toSlot.itemKey;
		const tempCount = toSlot.count;

		toSlot.itemKey = fromSlot.itemKey;
		toSlot.count = fromSlot.count;

		fromSlot.itemKey = tempItemKey;
		fromSlot.count = tempCount;

		return;
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
