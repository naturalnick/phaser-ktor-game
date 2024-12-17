import { Scene } from "phaser";
import { BasePlayer } from "./Player";

export class OtherPlayer extends BasePlayer {
	constructor(scene: Scene, x: number, y: number) {
		super(scene, x, y);
	}

	public moveTo(x: number, y: number): void {
		this.scene.tweens.add({
			targets: this.sprite,
			x: x,
			y: y,
			duration: 100,
			ease: "Linear",
		});
	}

	public update(): void {
		// Network players don't need regular updates
	}
}
