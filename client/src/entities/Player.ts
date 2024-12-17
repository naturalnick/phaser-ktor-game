import { Scene } from "phaser";

export abstract class BasePlayer {
	protected scene: Scene;
	protected sprite: Phaser.Physics.Arcade.Sprite;

	constructor(scene: Scene, x: number, y: number) {
		this.scene = scene;
		this.sprite = scene.physics.add.sprite(x, y, "player");
		this.sprite.setCollideWorldBounds(true);
		this.createAnimations();
	}

	protected createAnimations(): void {
		if (!this.scene.anims.exists("left")) {
			this.scene.anims.create({
				key: "left",
				frames: this.scene.anims.generateFrameNumbers("player", {
					start: 0,
					end: 3,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}

		if (!this.scene.anims.exists("turn")) {
			this.scene.anims.create({
				key: "turn",
				frames: [{ key: "player", frame: 4 }],
				frameRate: 20,
			});
		}

		if (!this.scene.anims.exists("right")) {
			this.scene.anims.create({
				key: "right",
				frames: this.scene.anims.generateFrameNumbers("player", {
					start: 5,
					end: 8,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}
	}

	public getSprite(): Phaser.Physics.Arcade.Sprite {
		return this.sprite;
	}

	public abstract update(): void;

	public destroy(): void {
		this.sprite.destroy();
	}
}
