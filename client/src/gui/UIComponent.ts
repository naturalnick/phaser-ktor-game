import { Scene } from "phaser";

export abstract class UIComponent {
	protected scene: Scene;
	protected container: Phaser.GameObjects.Container;

	constructor(scene: Scene) {
		this.scene = scene;
		this.container = this.scene.add.container(0, 0);
	}

	public getContainer(): Phaser.GameObjects.Container {
		return this.container;
	}

	abstract handleResize(gameSize: Phaser.Structs.Size): void;
	abstract destroy(): void;
}
