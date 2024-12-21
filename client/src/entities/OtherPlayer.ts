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
		});
	}

	private getDirectionFromAngle(
		angle: number
	): "UP" | "DOWN" | "LEFT" | "RIGHT" {
		// Convert angle to degrees and normalize to 0-360
		const degrees = Phaser.Math.RadToDeg(angle);
		const normalized = (degrees + 360) % 360;

		// Define angle ranges for each direction
		if (normalized >= 45 && normalized < 135) return "DOWN";
		if (normalized >= 135 && normalized < 225) return "LEFT";
		if (normalized >= 225 && normalized < 315) return "UP";
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
