import { Scene } from "phaser";

export class PlayerAnimationManager {
	private scene: Scene;
	private static instance: PlayerAnimationManager;
	private animationCache: Set<string> = new Set();

	private constructor(scene: Scene) {
		this.scene = scene;
	}

	public static getInstance(scene: Scene): PlayerAnimationManager {
		if (!PlayerAnimationManager.instance) {
			PlayerAnimationManager.instance = new PlayerAnimationManager(scene);
		}
		return PlayerAnimationManager.instance;
	}

	public createAnimationsForSprite(
		spriteKey: string,
		frameRate: number = 10
	): void {
		// Only create animations for this sprite key once
		if (this.animationCache.has(spriteKey)) {
			return;
		}

		const animations = [
			{ key: "up", start: 8, end: 11 },
			{ key: "down", start: 0, end: 3 },
			{ key: "left", start: 12, end: 15 },
			{ key: "right", start: 4, end: 7 },
		];

		animations.forEach(({ key, start, end }) => {
			const uniqueKey = `${spriteKey}_${key}`;
			if (!this.scene.anims.exists(uniqueKey)) {
				this.scene.anims.create({
					key: uniqueKey,
					frames: this.scene.anims.generateFrameNumbers(spriteKey, {
						start,
						end,
					}),
					frameRate: frameRate,
					repeat: -1,
				});
			}
		});

		this.animationCache.add(spriteKey);
	}

	public getAnimationKey(spriteKey: string, direction: string): string {
		return `${spriteKey}_${direction}`;
	}
}
