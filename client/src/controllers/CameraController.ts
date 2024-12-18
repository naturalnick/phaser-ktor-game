import { Scene } from "phaser";

export interface CameraConfig {
	lerp?: number;
	bounds?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	deadzone?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export class CameraController {
	private scene: Scene;
	private mainCamera: Phaser.Cameras.Scene2D.Camera;
	private target: Phaser.GameObjects.GameObject | null = null;

	constructor(scene: Scene, config?: CameraConfig) {
		this.scene = scene;
		this.mainCamera = scene.cameras.main;
		this.setupCamera(config);
	}

	public setupCamera(config?: CameraConfig) {
		if (config?.bounds) {
			const xMargin = Math.max(
				0,
				(this.scene.scale.width - config.bounds.width) / 2
			);
			const yMargin = Math.max(
				0,
				(this.scene.scale.height - config.bounds.height) / 2
			);

			this.mainCamera.setBounds(
				0,
				0,
				config.bounds.width,
				config.bounds.height
			);

			this.mainCamera.setViewport(
				xMargin,
				yMargin,
				Math.min(this.scene.scale.width, config.bounds.width),
				Math.min(this.scene.scale.height, config.bounds.height)
			);

			this.mainCamera.setZoom(2);
		}

		if (config?.deadzone) {
			this.mainCamera.setDeadzone(
				config.deadzone.width,
				config.deadzone.height
			);
		}

		if (config?.lerp) {
			this.mainCamera.setLerp(config.lerp);
		}
	}

	public startFollow(target: Phaser.GameObjects.GameObject): void {
		this.target = target;
		this.mainCamera.startFollow(target);
	}

	public stopFollow(): void {
		this.target = null;
		this.mainCamera.stopFollow();
	}

	public shake(duration: number, intensity: number = 0.05): void {
		this.mainCamera.shake(duration, intensity);
	}

	public fade(
		duration: number = 1000,
		color: number = 0x000000
	): Promise<void> {
		return new Promise((resolve) => {
			this.mainCamera.fadeOut(duration, color);
			this.mainCamera.once("camerafadeoutcomplete", resolve);
		});
	}

	public fadeIn(
		duration: number = 1000,
		color: number = 0x000000
	): Promise<void> {
		return new Promise((resolve) => {
			this.mainCamera.fadeIn(duration, color);
			this.mainCamera.once("camerafadeincomplete", resolve);
		});
	}
}
