import { Scene } from "phaser";
import { Enemy } from "../entities/Enemy";
import { MainPlayer } from "../entities/MainPlayer";
import { WebSocketService } from "../services/Sockets";

interface AttackConfig {
	cooldown?: number;
	range?: number;
	damage?: number;
}

export class AttackManager {
	private scene: Scene;
	private player: MainPlayer;
	private attackKey: Phaser.Input.Keyboard.Key;
	private _isAttacking: boolean = false;
	private cooldown: number;
	private _range: number;
	private damage: number;
	private lastAttackTime: number = 0;

	get isAttacking(): boolean {
		return this._isAttacking;
	}

	get range(): number {
		return this._range;
	}

	set range(range: number) {
		this._range = range;
	}

	constructor(scene: Scene, player: MainPlayer, config: AttackConfig = {}) {
		this.scene = scene;
		this.player = player;
		this.cooldown = config.cooldown || 500;
		this._range = config.range || 30;
		this.damage = config.damage || 20;

		if (scene.input.keyboard) {
			this.attackKey = scene.input.keyboard.addKey(
				Phaser.Input.Keyboard.KeyCodes.SPACE
			);
			this.setupAttackInput();
		}
	}

	private setupAttackInput(): void {
		this.attackKey.on("down", () => this.tryAttack());
	}

	private tryAttack(): void {
		const currentTime = this.scene.time.now;
		if (currentTime - this.lastAttackTime < this.cooldown) {
			return; // Still in cooldown
		}

		this._isAttacking = true;
		this.lastAttackTime = currentTime;

		// this.playAttackAnimation();

		// Check for enemies in attack range
		this.checkAttackCollision();

		// Reset attack state after a short duration
		this.scene.time.delayedCall(200, () => {
			this._isAttacking = false;
		});
	}

	// private playAttackAnimation(): void {
	// 	const sprite = this.player.sprite;
	// 	const facingDirection = this.player.getFacingDirection();

	// 	// temp animations
	// 	switch (facingDirection) {
	// 		case "UP":
	// 			sprite.anims.play("up", true);
	// 			break;
	// 		case "DOWN":
	// 			sprite.anims.play("down", true);
	// 			break;
	// 		case "LEFT":
	// 			sprite.anims.play("left", true);
	// 			break;
	// 		case "RIGHT":
	// 			sprite.anims.play("right", true);
	// 			break;
	// 	}
	// }

	private checkAttackCollision(): void {
		const sprite = this.player.sprite;
		const facingDirection = this.player.getFacingDirection();

		let attackX = sprite.x;
		let attackY = sprite.y;

		switch (facingDirection) {
			case "UP":
				attackY -= this.range / 6;
				break;
			case "DOWN":
				attackY += this.range / 2;
				break;
			case "LEFT":
				attackX -= this.range / 3.5;
				attackY += this.range / 10;
				break;
			case "RIGHT":
				attackX += this.range / 3.5;
				attackY += this.range / 10;
				break;
		}

		const nearbyObjects = this.scene.physics.overlapCirc(
			attackX,
			attackY,
			this.range / 2
		);

		for (const body of nearbyObjects) {
			const gameObject = body.gameObject;
			if (
				gameObject &&
				gameObject.getData &&
				gameObject.getData("type") === "enemy"
			) {
				const enemyInstance = gameObject.getData(
					"enemyInstance"
				) as Enemy;
				if (enemyInstance) {
					enemyInstance.takeDamage(this.damage);

					const sockets = this.scene.registry.get(
						"sockets"
					) as WebSocketService;
					sockets.sendEnemyDamage(enemyInstance.id, this.damage);

					this.onHit(enemyInstance);
				}
			}
		}
	}

	private onHit(enemy: Enemy): void {
		// Handle hit effects, sounds, etc
		console.log("Hit enemy!");
	}

	public setCooldown(cooldown: number): void {
		this.cooldown = cooldown;
	}

	public setDamage(damage: number): void {
		this.damage = damage;
	}

	public destroy(): void {
		this.attackKey.destroy();
	}
}
