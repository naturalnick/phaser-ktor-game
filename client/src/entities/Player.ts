import { Scene } from "phaser";
import { PlayerAnimationManager } from "../managers/PlayerAnimationManager";

const PLAYER_DIAGONAL_ANGLE = 5;

export abstract class BasePlayer {
	protected scene: Scene;
	protected _sprite: Phaser.Physics.Arcade.Sprite;
	protected animationManager: PlayerAnimationManager;
	protected spriteKey: string;

	get sprite(): Phaser.Physics.Arcade.Sprite {
		return this._sprite;
	}

	constructor(
		scene: Scene,
		x: number,
		y: number,
		spriteKey: string,
		frameRate?: number
	) {
		this.scene = scene;
		this.spriteKey = spriteKey;
		this._sprite = scene.physics.add.sprite(x, y, spriteKey);
		this.animationManager = PlayerAnimationManager.getInstance(scene);

		this.animationManager.createAnimationsForSprite(spriteKey, frameRate);

		// Setup collision
		const collisionRadius = this._sprite.width / 2.5;
		const offsetX = (this._sprite.width - collisionRadius * 2) / 2;
		const offsetY = this._sprite.height - collisionRadius * 2;

		this._sprite.body?.setCircle(collisionRadius, offsetX, offsetY);
		this._sprite.setDepth(3.1);
		this._sprite.setCollideWorldBounds(true);
	}

	protected playAnimation(direction: string): void {
		const animKey = this.animationManager.getAnimationKey(
			this.spriteKey,
			direction
		);

		this._sprite.anims.play(animKey, true);
	}

	protected adjustAngle(angle: MovingDirection | number | 0): void {
		let newAngle = 0;
		switch (angle) {
			case "UP_LEFT":
			case "DOWN_RIGHT":
				newAngle = PLAYER_DIAGONAL_ANGLE;
				break;
			case "UP_RIGHT":
			case "DOWN_LEFT":
				newAngle = -PLAYER_DIAGONAL_ANGLE;
				break;
			case 0: // applies to both set 0 rotation and 0 angle
				newAngle = 0;
				break;
			default: // may remove number input if I don't apply angles to network players
				if (typeof angle === "number") {
					const degrees = Phaser.Math.RadToDeg(angle);
					const normalized = (degrees + 360) % 360;

					if (normalized > 265 && normalized < 275) newAngle = 0;
					else if (normalized > 85 && normalized < 95) newAngle = 0;

					if (angle > 90 && angle < 270) {
						newAngle = PLAYER_DIAGONAL_ANGLE;
					} else {
						newAngle = -PLAYER_DIAGONAL_ANGLE;
					}
				}
				break;
		}
		if (newAngle !== Math.round(this._sprite.angle)) {
			this.scene.tweens.add({
				targets: this._sprite,
				angle: newAngle,
				duration: newAngle === 0 ? 1 : 80,
			});
		}
	}

	protected stopAnimation(): void {
		this._sprite.anims.stop();
	}

	public abstract update(): void;

	public destroy(): void {
		this._sprite.destroy();
	}
}

type MovingDirection = "UP_LEFT" | "UP_RIGHT" | "DOWN_LEFT" | "DOWN_RIGHT";
