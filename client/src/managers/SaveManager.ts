import { Scene } from "phaser";
import { MainPlayer } from "../entities/MainPlayer";
import { GameSaveData } from "../types/SaveData";
import { EnemyManager } from "./EnemyManager";
import { WorldItemManager } from "./WorldItemManager";

export class SaveManager {
	private static readonly SAVE_KEY = "game_save";
	private static readonly CURRENT_VERSION = "1.0.0";

	public static saveGame(scene: Scene): void {
		const player = scene.registry.get("player") as MainPlayer;
		const enemyManager = scene.registry.get("enemyManager") as EnemyManager;
		const worldItemManager = scene.registry.get(
			"worldItemManager"
		) as WorldItemManager;

		const saveData: GameSaveData = {
			player: {
				health: {
					current: player.getHealthManager().getCurrentHealth(),
					max: player.getHealthManager().getMaxHealth(),
				},
				position: {
					x: player.getSprite().x,
					y: player.getSprite().y,
					map: player.getCurrentMap() || "map1",
				},
				inventory: {
					items: player
						.getInventory()
						.getSlots()
						.map((slot) => ({
							key: slot.itemKey || "",
							count: slot.count,
						})),
				},
			},
			maps: {
				map1: {
					enemies: enemyManager.getEnemySaveData(),
					items: worldItemManager.getItems().map((item) => ({
						key: item.getItemKey(),
						x: item.x,
						y: item.y,
					})),
				},
			},
			version: this.CURRENT_VERSION,
			timestamp: Date.now(),
		};

		localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
	}

	public static saveEnemyState(scene: Scene): void {
		const player = scene.registry.get("player") as MainPlayer;
		const enemyManager = scene.registry.get("enemyManager") as EnemyManager;
		const enemyData = enemyManager.getEnemySaveData();

		const saveJson = localStorage.getItem(this.SAVE_KEY);
		const saveData = JSON.parse(saveJson || "{}") as GameSaveData;
		saveData.maps[player.getCurrentMap() ?? "map1"].enemies = enemyData;

		localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
	}

	public static saveItemState(scene: Scene): void {
		const player = scene.registry.get("player") as MainPlayer;
		const worldItemManager = scene.registry.get(
			"worldItemManager"
		) as WorldItemManager;

		const saveJson = localStorage.getItem(this.SAVE_KEY);
		const saveData = JSON.parse(saveJson || "{}") as GameSaveData;

		const itemData = worldItemManager.getItems().map((item) => ({
			key: item.getItemKey(),
			x: item.x,
			y: item.y,
		}));

		saveData.maps[player.getCurrentMap() ?? "map1"].items = itemData;

		localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
	}

	public static loadGame(scene: Scene): GameSaveData | null {
		const saveJson = localStorage.getItem(this.SAVE_KEY);
		if (!saveJson) return null;

		const saveData = JSON.parse(saveJson) as GameSaveData;

		// Version check for save compatibility
		if (saveData.version !== this.CURRENT_VERSION) {
			console.warn("Save data version mismatch - might need migration");
		}

		return saveData;
	}
}
