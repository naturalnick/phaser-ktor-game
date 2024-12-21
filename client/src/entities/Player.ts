import { Scene } from "phaser";
import { PlayerAnimationManager } from "../managers/PlayerAnimationManager";

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

	protected adjustAngle(angle: number): void {
		if (angle !== this._sprite.angle) {
			this.scene.tweens.add({
				targets: this._sprite,
				angle: angle,
				duration: angle === 0 ? 50 : 80,
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
