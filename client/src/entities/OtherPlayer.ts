import { Scene } from "phaser";
import { BasePlayer } from "./Player";

export class OtherPlayer extends BasePlayer {
	private stopAnimationTimer?: Phaser.Time.TimerEvent;

	constructor(
		scene: Scene,
		x: number,
		y: number,
		spriteKey: string,
		frameRate?: number
	) {
		super(scene, x, y, spriteKey, frameRate);
	}

	public moveTo(x: number, y: number): void {
		const angle = Phaser.Math.Angle.Between(
			this._sprite.x,
			this._sprite.y,
			x,
			y
		);
		// this.adjustAngle(angle);

		const direction = this.getDirectionFromAngle(angle);

		if (direction) {
			this.playAnimation(direction.toLowerCase());
		}

		this.resetStopAnimationTimer();

		this.scene.tweens.add({
			targets: this._sprite,
			x: x,
			y: y,
			duration: 100,
			ease: "Linear",
			onComplete: () => {},
		});
	}

	private resetStopAnimationTimer(): void {
		if (this.stopAnimationTimer) {
			this.stopAnimationTimer.destroy();
		}

		this.stopAnimationTimer = this.scene.time.delayedCall(200, () => {
			this.stopAnimation();
			// this.adjustAngle(0);
		});
	}

	private getDirectionFromAngle(
		angle: number
	): "UP" | "DOWN" | "LEFT" | "RIGHT" {
		const degrees = Phaser.Math.RadToDeg(angle);
		const normalized = (degrees + 360) % 360;

		// Slight margin on up and down directions due to normalize adjustments
		if (normalized > 265 && normalized < 275) return "UP";
		if (normalized > 85 && normalized < 95) return "DOWN";

		if (normalized > 90 && normalized < 270) return "LEFT";
		return "RIGHT";
	}

	public update(): void {
		// Network players don't need regular updates
	}

	public destroy(): void {
		if (this.stopAnimationTimer) {
			this.stopAnimationTimer.destroy();
		}
		super.destroy();
	}
}
