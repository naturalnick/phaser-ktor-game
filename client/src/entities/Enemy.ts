import { Scene } from "phaser";

interface EnemyConfig {
	x: number;
	y: number;
	damage?: number;
	speed?: number;
	canAttack?: boolean;
	attackDelay?: number;
	moveDelay?: number; // milliseconds
	detectionRadius?: number;
}

export class Enemy {
	private scene: Scene;
	private sprite: Phaser.Physics.Arcade.Sprite;
	private damage: number;
	private speed: number;
	private canAttack: boolean;
	private moveDelay: number;
	private isMoving: boolean = false;
	private moveTimer?: Phaser.Time.TimerEvent;
	private target?: Phaser.Physics.Arcade.Sprite;
	private detectionRadius: number;
	private hasDetectedPlayer: boolean = false;
	private attackDelay: number;
	private lastAttackTime: number = 0;
	private obstructed: boolean = false;

	constructor(scene: Scene, config: EnemyConfig) {
		this.scene = scene;
		this.damage = config.damage || 10;
		this.speed = config.speed || 50;
		this.canAttack = config.canAttack ?? true;
		this.attackDelay = config.attackDelay || 1000;
		this.moveDelay = config.moveDelay || 0;
		this.detectionRadius = config.detectionRadius || 200;

		this.sprite = scene.physics.add.sprite(config.x, config.y, "player");
		this.sprite.setCollideWorldBounds(true);

		this.createAnimations();
		this.startMovementCycle();
	}

	private createAnimations(): void {
		if (!this.scene.anims.exists("enemy-left")) {
			this.scene.anims.create({
				key: "enemy-left",
				frames: this.scene.anims.generateFrameNumbers("player", {
					start: 0,
					end: 3,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}

		if (!this.scene.anims.exists("enemy-right")) {
			this.scene.anims.create({
				key: "enemy-right",
				frames: this.scene.anims.generateFrameNumbers("player", {
					start: 5,
					end: 8,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}

		if (!this.scene.anims.exists("enemy-idle")) {
			this.scene.anims.create({
				key: "enemy-idle",
				frames: [{ key: "player", frame: 4 }],
				frameRate: 1,
			});
		}
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
		if (this.hasDetectedPlayer) return true;

		const distance = Phaser.Math.Distance.Between(
			this.sprite.x,
			this.sprite.y,
			this.target.x,
			this.target.y
		);

		if (distance <= this.detectionRadius) {
			this.hasDetectedPlayer = true;
			return true;
		} else {
			return false;
		}
	}

	private startMoving(): void {
		this.isMoving = true;
		if (!this.target) return;
		if (this.isPlayerDetected()) this.moveTowardsTarget();
		else this.moveRandomly();
	}

	private stopMoving(): void {
		this.isMoving = false;
		this.sprite.setVelocity(0, 0);
		this.sprite.play("enemy-idle");
	}

	private moveTowardsTarget(): void {
		if (!this.target || !this.isMoving) return;

		if (this.obstructed) {
			// Calculate direction to player
			const dx = this.target.x - this.sprite.x;
			const dy = this.target.y - this.sprite.y;
			const angleToPlayer = Math.atan2(dy, dx);

			// Always move perpendicular (+90 degrees) to player direction
			const perpendicularAngle = angleToPlayer + Math.PI / 2;

			this.sprite.setVelocityX(Math.cos(perpendicularAngle) * this.speed);
			this.sprite.setVelocityY(Math.sin(perpendicularAngle) * this.speed);
			this.obstructed = false;
		} else {
			// Normal pursuit behavior
			const dx = this.target.x - this.sprite.x;
			const dy = this.target.y - this.sprite.y;
			const angle = Math.atan2(dy, dx);
			this.sprite.setVelocityX(Math.cos(angle) * this.speed);
			this.sprite.setVelocityY(Math.sin(angle) * this.speed);
		}

		// Update animation based on current velocity
		const dx = this.sprite.body?.velocity.x ?? 0;
		if (Math.abs(dx) > Math.abs(this.sprite.body?.velocity.y ?? 0)) {
			this.sprite.play(dx > 0 ? "enemy-right" : "enemy-left", true);
		}
	}

	private moveRandomly(): void {
		if (!this.isMoving) return;

		// Check if enemy needs new direction
		if (this.sprite.body?.velocity.length() === 0) {
			// Choose completely random direction
			const randomAngle = Math.random() * Math.PI * 2;

			this.sprite.setVelocityX(Math.cos(randomAngle) * this.speed);
			this.sprite.setVelocityY(Math.sin(randomAngle) * this.speed);

			// Update animation based on new direction
			const dx = Math.cos(randomAngle);
			if (Math.abs(dx) > Math.abs(Math.sin(randomAngle))) {
				this.sprite.play(dx > 0 ? "enemy-right" : "enemy-left", true);
			}
		}
	}

	public setTarget(target: Phaser.Physics.Arcade.Sprite): void {
		this.target = target;
	}

	public update(): void {
		if (this.isMoving && this.target) {
			if (this.hasDetectedPlayer) {
				this.moveTowardsTarget();
			} else {
				this.moveRandomly();
			}
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

	public destroy(): void {
		if (this.moveTimer) {
			this.moveTimer.destroy();
		}
		this.sprite.destroy();
	}
}
