import { Scene } from "phaser";
import { Enemy } from "../entities/Enemy";
import { WebSocketService } from "../services/Sockets";
import { EnemySaveData } from "../types/SaveData";
import { MapManager } from "./MapManager";

interface EnemySetupConfig {
	player: Phaser.Physics.Arcade.Sprite;
	collisionLayers: Phaser.Tilemaps.TilemapLayer[];
	saveData?: EnemySaveData[];
}

export class EnemyManager {
	private scene: Scene;
	private enemies: Enemy[] = [];
	private mapManager: MapManager;
	private setupComplete: boolean = false;
	private showHealthBars: boolean = false;
	private isControlledByHost: boolean = false;

	constructor(scene: Scene, mapManager: MapManager) {
		this.scene = scene;
		this.mapManager = mapManager;
	}

	public initialize(config: EnemySetupConfig): void {
		const map = this.mapManager.getCurrentMap();
		if (!map) {
			console.warn("No map available for enemy initialization");
			return;
		}

		this.createAndSetupEnemies(map, config);
	}

	public updatePlayerPosition(playerId: string, x: number, y: number) {
		this.enemies.forEach((enemy) => {
			enemy.updatePlayerPosition(playerId, x, y);
		});
	}

	public removePlayer(playerId: string) {
		this.enemies.forEach((enemy) => {
			enemy.removePlayer(playerId);
		});
	}

	private createAndSetupEnemies(
		map: Phaser.Tilemaps.Tilemap,
		config: EnemySetupConfig
	): void {
		const enemyLayer = map.getObjectLayer("Enemies");
		if (!enemyLayer) {
			console.warn("No enemy layer found in the map");
			return;
		}

		// Clear existing enemies if any
		this.destroy();

		enemyLayer.objects.forEach((enemyObj) => {
			const enemySave = config.saveData?.find(
				(e) => e.id === enemyObj.id
			);
			if (enemySave) {
				enemyObj.x = enemySave.x;
				enemyObj.y = enemySave.y;
			}

			const enemy = new Enemy(this.scene, {
				id: enemyObj.id,
				x: enemyObj.x || 0,
				y: enemyObj.y || 0,
				health: this.getPropertyValue(enemyObj, "health", 100),
				damage: this.getPropertyValue(enemyObj, "damage", 10),
				speed: this.getPropertyValue(enemyObj, "speed", 30),
				canAttack: this.getPropertyValue(enemyObj, "canAttack", true),
				attackDelay: this.getPropertyValue(
					enemyObj,
					"attackDelay",
					1000
				),
				moveDelay: this.getPropertyValue(enemyObj, "moveDelay", 2000),
				showHealthBar: this.showHealthBars,
			});

			enemy.setTarget(config.player);
			enemy.setTileLayers(config.collisionLayers);

			// Register enemy type for combat system
			const sprite = enemy.sprite;
			sprite.setData("type", "enemy");
			sprite.name = `enemy-${enemy.id}`;

			this.setupEnemyCollisions(enemy, config);
			this.enemies.push(enemy);
		});

		this.setupComplete = true;
	}

	public updateEnemyPosition(enemyData: {
		mapId: string;
		enemy: EnemySaveData;
	}) {
		const enemy = this.enemies.find((e) => e.id === enemyData.enemy.id);
		if (enemy) {
			enemy.sprite.x = enemyData.enemy.x;
			enemy.sprite.y = enemyData.enemy.y;
		}
	}

	// public updateEnemyPositions(enemyData: {
	// 	mapId: string;
	// 	enemies: EnemySaveData[];
	// }): void {
	// 	if (this.isControlledByHost) return;

	// 	const currentMapId = this.mapManager.getCurrentMapId();
	// 	if (enemyData.mapId !== currentMapId) return;

	// 	enemyData.enemies.forEach((enemyUpdate) => {
	// 		const enemy = this.enemies.find((e) => e.id === enemyUpdate.id);
	// 		console.log(enemyUpdate.x, enemyUpdate.y);
	// 		if (enemy) {
	// 			// Use Phaser's built-in interpolation for smooth movement
	// 			this.scene.tweens.add({
	// 				targets: enemy.sprite,
	// 				x: enemyUpdate.x,
	// 				y: enemyUpdate.y,
	// 				duration: 100, // Match the broadcast interval
	// 				ease: "Linear",
	// 			});
	// 		}
	// 	});
	// }

	public setHostControl(isHost: boolean): void {
		this.isControlledByHost = isHost;

		// Update enemy behavior based on host status
		this.enemies.forEach((enemy) => {
			// If we're not the host, disable local movement logic
			enemy.localControlEnabled = isHost;
		});
	}

	private getPropertyValue(
		obj: Phaser.Types.Tilemaps.TiledObject,
		propertyName: string,
		defaultValue: any
	): any {
		return (
			obj.properties?.find((p: any) => p.name === propertyName)?.value ??
			defaultValue
		);
	}

	private setupEnemyCollisions(enemy: Enemy, config: EnemySetupConfig): void {
		// Player collision
		this.scene.physics.add.overlap(config.player, enemy.sprite, () =>
			enemy.handlePlayerCollision(config.player)
		);

		// Map collision
		config.collisionLayers.forEach((layer) => {
			this.scene.physics.add.collider(enemy.sprite, layer, () =>
				enemy.handleMapCollision()
			);
		});

		// Enemy-to-enemy collision
		this.enemies.forEach((otherEnemy) => {
			if (enemy !== otherEnemy) {
				this.scene.physics.add.collider(
					enemy.sprite,
					otherEnemy.sprite
				);
			}
		});

		// World bounds
		const mapBounds = this.mapManager.getMapBounds();
		if (mapBounds) {
			const sprite = enemy.sprite;
			sprite.setCollideWorldBounds(true);
			(sprite.body as Phaser.Physics.Arcade.Body).setBoundsRectangle(
				new Phaser.Geom.Rectangle(
					0,
					0,
					mapBounds.width,
					mapBounds.height
				)
			);
		}
	}

	public toggleHealthBars(): void {
		this.showHealthBars = !this.showHealthBars;
		this.enemies.forEach((enemy) =>
			enemy.setHealthBarVisible(this.showHealthBars)
		);
	}

	public getEnemySaveData(): EnemySaveData[] {
		return this.enemies.map((enemy) => enemy.getEnemyPosition());
	}

	public update(): void {
		if (this.setupComplete && this.isControlledByHost) {
			this.enemies.forEach((enemy) => enemy.update());
		}
	}

	public destroy(): void {
		this.enemies.forEach((enemy) => enemy.destroy());
		this.enemies = [];
		this.setupComplete = false;
	}
}
