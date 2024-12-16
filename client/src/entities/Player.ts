// src/entities/Player.ts
import { Scene, Types } from "phaser";

export class Player {
	private sprite: Phaser.Physics.Arcade.Sprite;
	private cursors: Types.Input.Keyboard.CursorKeys;
	private scene: Scene;

	constructor(scene: Scene, x: number, y: number) {
		this.scene = scene;
		this.sprite = scene.physics.add.sprite(x, y, "player");
		this.sprite.setCollideWorldBounds(true);

		const keys = scene.input.keyboard?.createCursorKeys();
		if (keys) this.cursors = keys;

		this.createAnimations();
	}

	private createAnimations(): void {
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

	public update(): void {
		if (!this.cursors || !this.sprite.body) return;

		if (this.cursors.left.isDown) {
			this.sprite.setVelocityX(-160);
			this.sprite.anims.play("left", true);
		} else if (this.cursors.right.isDown) {
			this.sprite.setVelocityX(160);
			this.sprite.anims.play("right", true);
		} else {
			this.sprite.setVelocityX(0);
			this.sprite.anims.play("turn");
		}

		if (this.cursors.up.isDown) {
			this.sprite.setVelocityY(-160);
		} else if (this.cursors.down.isDown) {
			this.sprite.setVelocityY(160);
		} else {
			this.sprite.setVelocityY(0);
		}
	}

	public getSprite(): Phaser.Physics.Arcade.Sprite {
		return this.sprite;
	}

	public getVelocity(): Phaser.Math.Vector2 {
		return this.sprite.body?.velocity ?? new Phaser.Math.Vector2();
	}
}
