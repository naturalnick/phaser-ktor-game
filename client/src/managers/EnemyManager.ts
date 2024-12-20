import { Scene } from "phaser";
import { Enemy } from "../entities/Enemy";
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
			// Check saved position
			const enemySave = config.saveData?.find(
				(e) => e.id === enemyObj.id
			);
			if (enemySave) {
				enemyObj.x = enemySave.x;
				enemyObj.y = enemySave.y;
			}

			// Create enemy with properties from map
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
			});

			// Set up enemy
			enemy.setTarget(config.player);
			enemy.setTileLayers(config.collisionLayers);

			// Register enemy type for combat system
			const sprite = enemy.getSprite();
			sprite.setData("type", "enemy");
			sprite.name = `enemy-${enemy.id}`;

			this.setupEnemyCollisions(enemy, config);
			this.enemies.push(enemy);
		});

		this.setupComplete = true;
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
		this.scene.physics.add.overlap(config.player, enemy.getSprite(), () =>
			enemy.handlePlayerCollision(config.player)
		);

		// Map collision
		config.collisionLayers.forEach((layer) => {
			this.scene.physics.add.collider(enemy.getSprite(), layer, () =>
				enemy.handleMapCollision()
			);
		});

		// Enemy-to-enemy collision
		this.enemies.forEach((otherEnemy) => {
			if (enemy !== otherEnemy) {
				this.scene.physics.add.collider(
					enemy.getSprite(),
					otherEnemy.getSprite()
				);
			}
		});

		// World bounds
		const mapBounds = this.mapManager.getMapBounds();
		if (mapBounds) {
			const sprite = enemy.getSprite();
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

	public getEnemySaveData(): EnemySaveData[] {
		return this.enemies.map((enemy) => enemy.getEnemyPosition());
	}

	public update(): void {
		if (this.setupComplete) {
			this.enemies.forEach((enemy) => enemy.update());
		}
	}

	public destroy(): void {
		this.enemies.forEach((enemy) => enemy.destroy());
		this.enemies = [];
		this.setupComplete = false;
	}
}
