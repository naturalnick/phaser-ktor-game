import { Scene } from "phaser";
import { ChatUI } from "../gui/ChatUI";
import { HealthBarUI } from "../gui/HealthBarUI";
import { InventoryUI } from "../gui/InventoryUI";
import { WebSocketService } from "../services/Sockets";

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
	private healthBarUI: HealthBarUI;
	private inventoryUI: InventoryUI;
	private chatUI: ChatUI | null = null;

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

		this.healthBarUI = new HealthBarUI(scene);
		this.inventoryUI = new InventoryUI(scene);

		this.uiContainer.add([
			this.healthBarUI.getContainer(),
			this.inventoryUI.getContainer(),
		]);

		this.updateCameraIgnoreList();
		this.scene.cameras.main.ignore([this.uiContainer]);
		this.scene.scale.on("resize", this.handleResize, this);
	}

	public initializeChatUI(webSocketService: WebSocketService): void {
		this.chatUI = new ChatUI(
			this.scene,
			{
				width: 300,
				height: 200,
			},
			webSocketService
		);
		this.uiContainer.add(this.chatUI.getContainer());
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

		// Handle resize for individual UI components
		this.chatUI?.handleResize(gameSize);
		this.inventoryUI.handleResize(gameSize);
	}

	private updateCameraIgnoreList(): void {
		this.uiCamera.ignore(
			this.scene.children.list.filter((obj) => {
				if (obj === this.uiContainer) return false;
				if (obj instanceof Phaser.GameObjects.Sprite) return true;
				return true;
			})
		);
	}

	public getUIContainer(): Phaser.GameObjects.Container {
		return this.uiContainer;
	}

	public getUICamera(): Phaser.Cameras.Scene2D.Camera {
		return this.uiCamera;
	}

	public getInventoryUI(): InventoryUI {
		return this.inventoryUI;
	}

	public updateHealthBar(currentHealth: number, maxHealth: number): void {
		this.healthBarUI.update(currentHealth, maxHealth);
	}

	public updateIgnoreList(): void {
		this.updateCameraIgnoreList();
	}

	public destroy(): void {
		this.uiCamera.destroy();
		this.uiContainer.destroy();
		this.scene.scale.off("resize", this.handleResize);
	}
}
