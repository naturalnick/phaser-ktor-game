import { Scene } from "phaser";
import { EnemySaveData } from "../types/SaveData";

interface EnemyConfig {
	id: number;
	x: number;
	y: number;
	damage?: number;
	speed?: number;
	canAttack?: boolean;
	attackDelay?: number;
	moveDelay?: number; // milliseconds
	detectionRadius?: number;
	escapeRadius?: number;
}

export class Enemy {
	private scene: Scene;
	private id: number;
	private sprite: Phaser.Physics.Arcade.Sprite;
	private damage: number;
	private speed: number;
	private canAttack: boolean;
	private moveDelay: number;
	private obstructed: boolean = false;
	private isMoving: boolean = false;
	private moveTimer?: Phaser.Time.TimerEvent;
	private target?: Phaser.Physics.Arcade.Sprite;
	private detectionRadius: number;
	private escapeRadius: number;
	private hasDetectedPlayer: boolean = false;
	private lastTargetPosition?: { x: number; y: number } = undefined;
	private attackDelay: number;
	private lastAttackTime: number = 0;
	private currentSpriteDepth: number = 3;
	private tileLayers?: Phaser.Tilemaps.TilemapLayer[];
	private playerHost?: string;

	constructor(scene: Scene, config: EnemyConfig) {
		this.scene = scene;
		this.id = config.id;
		this.damage = config.damage || 10;
		this.speed = config.speed || 50;
		this.canAttack = config.canAttack ?? true;
		this.attackDelay = config.attackDelay || 1000;
		this.moveDelay = config.moveDelay || 0;
		this.detectionRadius = config.detectionRadius || 200;
		this.escapeRadius = config.escapeRadius || 300;

		this.sprite = scene.physics.add.sprite(config.x, config.y, "slime");

		this.setHitbox();
		this.sprite.setDepth(this.currentSpriteDepth);
		this.sprite.setCollideWorldBounds(true);

		this.startMovementCycle();
	}

	private setHitbox() {
		const collisionRadius = this.sprite.width / 3;
		const offsetX = (this.sprite.width - collisionRadius * 2) / 2;
		const offsetY = this.sprite.height - collisionRadius * 2;
		this.sprite.body?.setCircle(collisionRadius, offsetX, offsetY);
		this.sprite.setScale(0.5); // temporary for this sprite which is 32x32
	}

	private startMovementCycle(): void {
		if (this.moveDelay === 0) {
			this.startMoving();
			return;
		}

		this.moveTimer = this.scene.time.addEvent({
			delay: this.moveDelay,
			callback: () => {
				if (this.isMoving) {
					this.stopMoving();
				} else {
					this.startMoving();
				}
			},
			loop: true,
		});

		this.startMoving();
	}

	private isPlayerDetected(): boolean {
		if (!this.target) return false;

		const distance = Phaser.Math.Distance.Between(
			this.sprite.x,
			this.sprite.y,
			this.target.x,
			this.target.y
		);

		if (distance > this.escapeRadius) return false;

		if (distance <= this.detectionRadius || this.hasDetectedPlayer) {
			return true;
		}
		return false;
	}

	private startMoving(): void {
		this.isMoving = true;
	}

	private stopMoving(): void {
		this.isMoving = false;
		this.sprite.setVelocity(0, 0);
	}

	public setTileLayers(layer: Phaser.Tilemaps.TilemapLayer[]): void {
		this.tileLayers = layer;
	}

	private hasLineOfSight(): boolean {
		if (!this.target || !this.tileLayers) return false;

		const ray = new Phaser.Geom.Line(
			this.sprite.x,
			this.sprite.y,
			this.target.x,
			this.target.y
		);

		// Use the first layer's tilemap properties (they should be the same for all layers)
		const tileWidth = this.tileLayers[0].tilemap.tileWidth;
		const tileHeight = this.tileLayers[0].tilemap.tileHeight;

		// Get points along the ray
		const points = ray.getPoints(0, Math.max(tileWidth, tileHeight));

		// Check each point against all tile layers
		for (const point of points) {
			for (const layer of this.tileLayers) {
				const tile = layer.getTileAtWorldXY(point.x, point.y);
				if (tile && tile.collides) {
					return false; // Line of sight is blocked
				}
			}
		}

		return true; // No collisions found in any layer
	}

	private moveTowardsTarget(): void {
		if (!this.target || !this.isMoving || !this.lastTargetPosition) return;

		const dx = this.lastTargetPosition.x - this.sprite.x;
		const dy = this.lastTargetPosition.y - this.sprite.y;
		const angle = Math.atan2(dy, dx);
		this.sprite.setVelocityX(Math.cos(angle) * this.speed);
		this.sprite.setVelocityY(Math.sin(angle) * this.speed);

		this.sprite.setFlipX((this.sprite.body?.velocity.x ?? 0) > 0);
	}

	private moveRandomly(): void {
		if (!this.isMoving) return;
		// Check if enemy needs new direction
		if (this.sprite.body?.velocity.length() === 0) {
			const randomAngle = Math.random() * Math.PI * 2;

			this.sprite.setVelocityX(Math.cos(randomAngle) * this.speed);
			this.sprite.setVelocityY(Math.sin(randomAngle) * this.speed);

			// Optional: Flip the sprite horizontally based on movement direction
			this.sprite.setFlipX(Math.cos(randomAngle) > 0);
		} else if (this.obstructed) {
			this.sprite.setVelocityX(-(this.sprite.body?.velocity?.x ?? 0));
			this.sprite.setVelocityY(-(this.sprite.body?.velocity?.y ?? 0));
			this.obstructed = false;
		}
	}

	private checkDetection(): void {
		if (!this.target) return;

		this.hasDetectedPlayer = this.isPlayerDetected();
		const has = this.hasLineOfSight();

		if (this.hasDetectedPlayer && has) {
			this.lastTargetPosition = {
				x: this.target.x,
				y: this.target.y,
			};
		}
	}

	public setTarget(target: Phaser.Physics.Arcade.Sprite): void {
		this.target = target;
	}

	private setSpriteDepth() {
		if (
			(this.target?.y ?? 0) < this.sprite.y &&
			this.currentSpriteDepth !== 2.9
		) {
			this.sprite.setDepth(3.5);
			this.currentSpriteDepth = 2.5;
		} else if (
			(this.target?.y ?? 0) > this.sprite.y &&
			this.currentSpriteDepth !== 3.1
		) {
			this.sprite.setDepth(2.5);
			this.currentSpriteDepth = 3.5;
		}
	}

	public getSprite(): Phaser.Physics.Arcade.Sprite {
		return this.sprite;
	}

	public handlePlayerCollision(player: Phaser.Physics.Arcade.Sprite): void {
		if (!this.canAttack) return;

		const currentTime = this.scene.time.now;
		if (currentTime - this.lastAttackTime >= this.attackDelay) {
			this.scene.events.emit("playerDamaged", this.damage);
			this.lastAttackTime = currentTime;
		}

		this.obstructed = false;
	}

	public handleMapCollision(): void {
		this.obstructed = true;
	}

	public getEnemyPosition(): EnemySaveData {
		return {
			id: this.id,
			x: this.sprite.x,
			y: this.sprite.y,
		};
	}

	public update(): void {
		this.checkDetection();

		if (this.hasDetectedPlayer && this.isMoving) {
			this.moveTowardsTarget();
		} else if (this.isMoving) {
			this.moveRandomly();
		}

		this.setSpriteDepth();
	}

	public destroy(): void {
		if (this.sprite) {
			this.sprite.destroy();
		}

		if (this.moveTimer) {
			this.moveTimer.destroy();
		}

		this.target = undefined;
		this.lastTargetPosition = undefined;
		this.tileLayers = undefined;
	}
}
