import { Scene } from "phaser";
import { WorldItem } from "../entities/WorldItem";
import { ItemSaveData } from "../types/SaveData";

export class WorldItemManager {
	private scene: Scene;
	private worldItems: WorldItem[] = [];
	private defaultStartPositions = [
		{ x: 600, y: 600, key: "sword" },
		{ x: 200, y: 150, key: "shroom" },
		{ x: 300, y: 200, key: "shroom" },
	];

	constructor(scene: Scene) {
		this.scene = scene;
		this.scene.registry.set("worldItems", this.worldItems);
	}

	loadItems(saveData?: ItemSaveData[]): void {
		this.clearItems();

		if (saveData) {
			this.loadSavedItems(saveData);
			return;
		}

		this.loadDefaultItems();
	}

	private loadSavedItems(saveData: ItemSaveData[]): void {
		saveData.forEach((item) => {
			const worldItem = new WorldItem(
				this.scene,
				item.x,
				item.y,
				item.key
			);
			this.worldItems.push(worldItem);
		});
	}

	private loadDefaultItems(): void {
		this.defaultStartPositions.forEach((pos) => {
			const worldItem = new WorldItem(this.scene, pos.x, pos.y, pos.key);
			this.worldItems.push(worldItem);
		});
	}

	dropItem(x: number, y: number, key: string): WorldItem {
		const worldItem = new WorldItem(this.scene, x, y, key);
		this.worldItems.push(worldItem);
		return worldItem;
	}

	removeItem(item: WorldItem): void {
		const index = this.worldItems.indexOf(item);
		if (index > -1) {
			this.worldItems.splice(index, 1);
			item.destroy();
		}
	}

	private clearItems(): void {
		this.worldItems.forEach((item) => item.destroy());
		this.worldItems = [];
		this.scene.registry.set("worldItems", this.worldItems);
	}

	getItems(): WorldItem[] {
		return this.worldItems;
	}

	destroy(): void {
		this.clearItems();
	}
}
