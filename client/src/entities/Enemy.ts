import { Scene } from "phaser";
import { HealthManager } from "../managers/HealthManager";
import { EnemySaveData } from "../types/SaveData";

interface EnemyConfig {
	id: number;
	x: number;
	y: number;
	health: number;
	damage?: number;
	speed?: number;
	canAttack?: boolean;
	attackDelay?: number;
	moveDelay?: number;
	detectionRadius?: number;
	escapeRadius?: number;
	showHealthBar?: boolean;
}

export class Enemy {
	private scene: Scene;
	public readonly id: number;
	private _sprite: Phaser.Physics.Arcade.Sprite;
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
	private healthManager: HealthManager;
	private healthBar?: Phaser.GameObjects.Graphics;
	private healthBarWidth: number;
	private healthBarHeight: number = 4;
	private showHealthBar: boolean;

	get sprite(): Phaser.Physics.Arcade.Sprite {
		return this._sprite;
	}

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

		this._sprite = scene.physics.add.sprite(config.x, config.y, "slime");
		this._sprite.setData("type", "enemy");
		this._sprite.setData("enemyInstance", this);
		this._sprite.name = `enemy-${this.id}`;

		this.healthManager = new HealthManager(scene, config.health, {
			onChange: (current, max) => {
				this.onHealthChange(current, max);
			},
			onDeath: () => {
				this.onDeath();
			},
		});
		this.showHealthBar = config.showHealthBar ?? false;
		if (this.showHealthBar) {
			this.createHealthBar();
		}

		this.setupPhysics();
		this.startMovementCycle();
	}

	private createHealthBar(): void {
		console.log(this.sprite.width);
		this.healthBarWidth = this.sprite.width * 0.75;
		this.healthBar = this.scene.add.graphics();
		this.updateHealthBar();

		// Set the depth slightly higher than the sprite to ensure it renders above
		this.healthBar.setDepth(this.currentSpriteDepth + 0.1);
	}

	private updateHealthBar(): void {
		if (!this.healthBar || !this.showHealthBar) return;

		// Clear the previous health bar
		this.healthBar.clear();

		// Calculate health percentage
		const healthPercent =
			this.healthManager.getCurrentHealth() /
			this.healthManager.getMaxHealth();

		// Calculate position (centered above the sprite)
		const barX = this.sprite.x - this.healthBarWidth / 2;
		const barY =
			this.sprite.y -
			this.sprite.displayHeight / 2 -
			this.healthBarHeight -
			5;

		// Draw background (gray)
		this.healthBar.fillStyle(0x808080, 0.8);
		this.healthBar.fillRect(
			barX,
			barY,
			this.healthBarWidth,
			this.healthBarHeight
		);

		// Draw health (green)
		this.healthBar.fillStyle(0x00ff00, 1);
		this.healthBar.fillRect(
			barX,
			barY,
			this.healthBarWidth * healthPercent,
			this.healthBarHeight
		);

		this.healthBar.setDepth(this.sprite.depth + 0.1);
	}

	public setHealthBarVisible(visible: boolean): void {
		this.showHealthBar = visible;
		if (visible && !this.healthBar) {
			this.createHealthBar();
		} else if (!visible && this.healthBar) {
			this.healthBar.destroy();
			this.healthBar = undefined;
		}
	}

	private setupPhysics(): void {
		const collisionRadius = this.sprite.width / 3;
		const offsetX = (this.sprite.width - collisionRadius * 2) / 2;
		const offsetY = this.sprite.height - collisionRadius * 2;

		this.sprite.body?.setCircle(collisionRadius, offsetX, offsetY);
		this.sprite.setScale(0.5);
		this.sprite.setDepth(this.currentSpriteDepth);
		this.sprite.setCollideWorldBounds(true);
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

		if (distance > this.escapeRadius) {
			this.hasDetectedPlayer = false;
			return false;
		}

		if (distance <= this.detectionRadius || this.hasDetectedPlayer) {
			this.hasDetectedPlayer = true;
			return true;
		}

		return false;
	}

	private hasLineOfSight(): boolean {
		if (!this.target || !this.tileLayers) return false;

		const ray = new Phaser.Geom.Line(
			this.sprite.x,
			this.sprite.y,
			this.target.x,
			this.target.y
		);

		const tileWidth = this.tileLayers[0].tilemap.tileWidth;
		const tileHeight = this.tileLayers[0].tilemap.tileHeight;
		const points = ray.getPoints(0, Math.max(tileWidth, tileHeight));

		for (const point of points) {
			for (const layer of this.tileLayers) {
				const tile = layer.getTileAtWorldXY(point.x, point.y);
				if (tile && tile.collides) {
					return false;
				}
			}
		}

		return true;
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

		if (this.sprite.body?.velocity.length() === 0) {
			const randomAngle = Math.random() * Math.PI * 2;
			this.sprite.setVelocityX(Math.cos(randomAngle) * this.speed);
			this.sprite.setVelocityY(Math.sin(randomAngle) * this.speed);
			this.sprite.setFlipX(Math.cos(randomAngle) > 0);
		} else if (this.obstructed) {
			this.sprite.setVelocityX(-(this.sprite.body?.velocity?.x ?? 0));
			this.sprite.setVelocityY(-(this.sprite.body?.velocity?.y ?? 0));
			this.obstructed = false;
		}
	}

	private startMoving(): void {
		this.isMoving = true;
	}

	private stopMoving(): void {
		this.isMoving = false;
		this.sprite.setVelocity(0, 0);
	}

	private checkDetection(): void {
		if (!this.target) return;

		this.hasDetectedPlayer = this.isPlayerDetected();
		const hasLineOfSight = this.hasLineOfSight();

		if (this.hasDetectedPlayer && hasLineOfSight) {
			this.lastTargetPosition = {
				x: this.target.x,
				y: this.target.y,
			};
		}
	}

	private setSpriteDepth(): void {
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

	private onHealthChange(current: number, max: number): void {
		// Add visual feedback when health changes
		this.scene.tweens.add({
			targets: this.sprite,
			alpha: 0.5,
			duration: 100,
			yoyo: true,
			repeat: 1,
			ease: "Linear",
		});
	}

	public setTarget(target: Phaser.Physics.Arcade.Sprite): void {
		this.target = target;
	}

	public setTileLayers(layers: Phaser.Tilemaps.TilemapLayer[]): void {
		this.tileLayers = layers;
	}

	public handlePlayerCollision(player: Phaser.Physics.Arcade.Sprite): void {
		if (!this.canAttack) return;

		const currentTime = this.scene.time.now;
		if (currentTime - this.lastAttackTime >= this.attackDelay) {
			this.scene.events.emit("playerDamaged", this.damage);
			this.lastAttackTime = currentTime;
		}
	}

	public handleMapCollision(): void {
		this.obstructed = true;
	}

	public takeDamage(amount: number): void {
		this.healthManager.damage(amount);
	}

	public getEnemyPosition(): EnemySaveData {
		return {
			id: this.id,
			x: this.sprite.x,
			y: this.sprite.y,
			// health: this.healthManager.getCurrentHealth()
		};
	}

	private onDeath(): void {
		// Add death effects
		this.scene.tweens.add({
			targets: this.sprite,
			alpha: 0,
			y: this.sprite.y - 16,
			duration: 200,
			ease: "Power2",
			onComplete: () => {
				this.destroy();
			},
		});

		// Emit death event for any listeners
		this.scene.events.emit("enemyDeath", this.id);
	}

	public update(): void {
		this.checkDetection();
		this.updateHealthBar();

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

		if (this.healthBar) {
			this.healthBar.destroy();
		}

		this.target = undefined;
		this.lastTargetPosition = undefined;
		this.tileLayers = undefined;
	}
}
