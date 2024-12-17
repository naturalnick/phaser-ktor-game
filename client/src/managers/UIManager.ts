import { Scene } from "phaser";
import { InventoryUI } from "../gui/InventoryUI";

export interface UIManagerConfig {
	bounds?: {
		width: number;
		height: number;
	};
}

export class UIManager {
	private scene: Scene;
	private uiCamera: Phaser.Cameras.Scene2D.Camera;
	private uiContainer: Phaser.GameObjects.Container;
	private config?: UIManagerConfig;

	constructor(scene: Scene, config?: UIManagerConfig) {
		this.scene = scene;
		this.config = config;
		this.uiContainer = this.scene.add.container(0, 0);
		this.uiContainer.setScrollFactor(0);

		const { xMargin, yMargin, viewportWidth, viewportHeight } =
			this.calculateViewportDimensions();

		this.uiCamera = this.scene.cameras.add(
			xMargin,
			yMargin,
			viewportWidth,
			viewportHeight
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

	private calculateViewportDimensions() {
		const boundsWidth =
			this.config?.bounds?.width ?? this.scene.scale.width;
		const boundsHeight =
			this.config?.bounds?.height ?? this.scene.scale.height;

		const xMargin = Math.max(0, (this.scene.scale.width - boundsWidth) / 2);
		const yMargin = Math.max(
			0,
			(this.scene.scale.height - boundsHeight) / 2
		);

		const viewportWidth = Math.min(this.scene.scale.width, boundsWidth);
		const viewportHeight = Math.min(this.scene.scale.height, boundsHeight);

		return { xMargin, yMargin, viewportWidth, viewportHeight };
	}

	private handleResize(gameSize: Phaser.Structs.Size): void {
		const { xMargin, yMargin, viewportWidth, viewportHeight } =
			this.calculateViewportDimensions();

		this.uiCamera.setViewport(
			xMargin,
			yMargin,
			viewportWidth,
			viewportHeight
		);
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
