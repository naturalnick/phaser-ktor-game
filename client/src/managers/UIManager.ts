import { Scene } from "phaser";

export class UIManager {
	private scene: Scene;
	private uiCamera: Phaser.Cameras.Scene2D.Camera;
	private uiContainer: Phaser.GameObjects.Container;

	constructor(scene: Scene) {
		this.scene = scene;

		this.uiContainer = this.scene.add.container(0, 0);
		this.uiContainer.setScrollFactor(0);

		this.uiCamera = this.scene.cameras.add(
			0,
			0,
			scene.scale.width,
			scene.scale.height
		);
		this.uiCamera.setName("uiCamera");

		this.uiCamera.ignore(
			this.scene.children.list.filter((obj) => {
				if (obj === this.uiContainer) return false;

				if (obj instanceof Phaser.GameObjects.Sprite) return true;

				return true;
			})
		);

		this.scene.cameras.main.ignore([this.uiContainer]);

		this.scene.scale.on("resize", this.handleResize, this);
	}

	private handleResize(gameSize: Phaser.Structs.Size): void {
		this.uiCamera.setViewport(0, 0, gameSize.width, gameSize.height);
	}

	public getUIContainer(): Phaser.GameObjects.Container {
		return this.uiContainer;
	}

	public getUICamera(): Phaser.Cameras.Scene2D.Camera {
		return this.uiCamera;
	}

	public updateIgnoreList(): void {
		this.uiCamera.ignore(
			this.scene.children.list.filter((obj) => {
				if (obj === this.uiContainer) return false;
				if (obj instanceof Phaser.GameObjects.Sprite) return true;
				return true;
			})
		);
	}

	public destroy(): void {
		this.uiCamera.destroy();
		this.uiContainer.destroy();
		this.scene.scale.off("resize", this.handleResize);
	}
}
