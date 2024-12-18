import { Scene } from "phaser";
import { ITEM_DATABASE } from "../types/Item";

export class WorldItem extends Phaser.GameObjects.Container {
	private itemKey: string;
	private sprite: Phaser.GameObjects.Sprite;

	constructor(scene: Scene, x: number, y: number, itemKey: string) {
		super(scene, x, y);

		this.itemKey = itemKey;
		const itemData = ITEM_DATABASE[itemKey];

		this.sprite = scene.add.sprite(0, 0, itemData.sprite);
		this.sprite.setDisplaySize(16, 16);
		this.sprite.setOrigin(-0.5);

		// if (itemData.scale) {
		// 	this.sprite.setScale(itemData.scale);
		// }

		this.add(this.sprite);
		scene.add.existing(this);
		scene.physics.add.existing(this, false);

		scene.tweens.add({
			targets: this,
			y: y - 5,
			duration: 1000,
			yoyo: true,
			repeat: -1,
		});
	}

	public getItemKey(): string {
		return this.itemKey;
	}
}
