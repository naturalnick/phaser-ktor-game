import { Scene } from "phaser";
import { Enemy } from "../entities/Enemy";
import { MapManager } from "./MapManager";

export class EnemyManager {
	private scene: Scene;
	private enemies: Enemy[] = [];
	private playerSprite?: Phaser.Physics.Arcade.Sprite;
	private mapManager: MapManager;

	constructor(scene: Scene, mapManager: MapManager) {
		this.scene = scene;
		this.mapManager = mapManager;
	}

	public createEnemiesFromMap(map: Phaser.Tilemaps.Tilemap): void {
		const enemyLayer = map.getObjectLayer("Enemies");

		if (!enemyLayer) {
			console.warn("No enemy layer found in the map");
			return;
		}

		enemyLayer.objects.forEach((enemyObj) => {
			const enemy = new Enemy(this.scene, {
				x: enemyObj.x || 0,
				y: enemyObj.y || 0,
				damage:
					enemyObj.properties?.find((p: any) => p.name === "damage")
						?.value || 10,
				speed:
					enemyObj.properties?.find((p: any) => p.name === "speed")
						?.value || 30,
				canAttack:
					enemyObj.properties?.find(
						(p: any) => p.name === "canAttack"
					)?.value ?? true,
				attackDelay:
					enemyObj.properties?.find(
						(p: any) => p.name === "attackDelay"
					)?.value || 1000,
				moveDelay:
					enemyObj.properties?.find(
						(p: any) => p.name === "moveDelay"
					)?.value || 2000,
			});

			if (this.playerSprite) {
				enemy.setTarget(this.playerSprite);
			}

			this.enemies.push(enemy);
		});
	}

	public setPlayerTarget(player: Phaser.Physics.Arcade.Sprite): void {
		this.playerSprite = player;
		this.enemies.forEach((enemy) => enemy.setTarget(player));
	}

	public setupCollisions(
		player: Phaser.Physics.Arcade.Sprite,
		collisionLayers: Phaser.Tilemaps.TilemapLayer[]
	): void {
		this.setPlayerTarget(player);

		this.enemies.forEach((enemy) => {
			// Add collision with the player
			this.scene.physics.add.overlap(player, enemy.getSprite(), () =>
				enemy.handlePlayerCollision(player)
			);

			// Add collision with the map
			collisionLayers.forEach((layer) => {
				this.scene.physics.add.collider(enemy.getSprite(), layer, () =>
					enemy.handleMapCollision()
				);
			});

			// Add collision between enemies
			this.enemies.forEach((otherEnemy) => {
				if (enemy !== otherEnemy) {
					this.scene.physics.add.collider(
						enemy.getSprite(),
						otherEnemy.getSprite()
					);
				}
			});

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
		});
	}

	public update(): void {
		this.enemies.forEach((enemy) => enemy.update());
	}

	public destroy(): void {
		this.enemies.forEach((enemy) => enemy.destroy());
		this.enemies = [];
	}
}
