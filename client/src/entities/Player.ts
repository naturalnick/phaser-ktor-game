import { Scene } from "phaser";

export abstract class BasePlayer {
	protected scene: Scene;
	protected _sprite: Phaser.Physics.Arcade.Sprite;

	get sprite(): Phaser.Physics.Arcade.Sprite {
		return this._sprite;
	}

	constructor(scene: Scene, x: number, y: number) {
		this.scene = scene;
		this._sprite = scene.physics.add.sprite(x, y, "player2");

		const collisionRadius = this._sprite.width / 2.5;
		const offsetX = (this._sprite.width - collisionRadius * 2) / 2;
		const offsetY = this._sprite.height - collisionRadius * 2;
		this._sprite.body?.setCircle(collisionRadius, offsetX, offsetY);

		this._sprite.setDepth(3.1);
		this._sprite.setCollideWorldBounds(true);
		this.createAnimations();
	}

	protected createAnimations(): void {
		if (!this.scene.anims.exists("up")) {
			this.scene.anims.create({
				key: "up",
				frames: this.scene.anims.generateFrameNumbers("player2", {
					start: 8,
					end: 11,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}
		if (!this.scene.anims.exists("down")) {
			this.scene.anims.create({
				key: "down",
				frames: this.scene.anims.generateFrameNumbers("player2", {
					start: 0,
					end: 3,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}
		if (!this.scene.anims.exists("left")) {
			this.scene.anims.create({
				key: "left",
				frames: this.scene.anims.generateFrameNumbers("player2", {
					start: 12,
					end: 15,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}
		if (!this.scene.anims.exists("right")) {
			this.scene.anims.create({
				key: "right",
				frames: this.scene.anims.generateFrameNumbers("player2", {
					start: 4,
					end: 7,
				}),
				frameRate: 10,
				repeat: -1,
			});
		}
	}

	public abstract update(): void;

	public destroy(): void {
		this._sprite.destroy();
	}
}
