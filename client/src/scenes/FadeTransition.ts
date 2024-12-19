import { Scene } from "phaser";
import { SaveManager } from "../managers/SaveManager";

export class FadeTransition extends Scene {
	constructor() {
		super({ key: "FadeTransition" });
	}

	create({
		targetScene,
		targetMap,
		playerPosition,
		fadeColor = 0x000000,
		duration = 500,
		onComplete,
	}: {
		targetScene: string;
		targetMap: string;
		playerPosition: { x: number; y: number };
		fadeColor?: number;
		duration?: number;
		onComplete?: () => void;
	}) {
		const rect = this.add.rectangle(
			0,
			0,
			this.scale.width,
			this.scale.height,
			fadeColor
		);
		rect.setOrigin(0, 0);
		rect.setAlpha(0);

		// Fade in
		this.tweens.add({
			targets: rect,
			alpha: 1,
			duration: duration / 2,
			onComplete: () => {
				this.scene.start(targetScene, {
					targetMap,
					playerPosition,
				});

				// Fade out
				this.tweens.add({
					targets: rect,
					alpha: 0,
					duration: duration / 2,
					onComplete: () => {
						this.scene.remove(this);
						if (onComplete) {
							onComplete();
						}
					},
				});
			},
		});
	}
}
