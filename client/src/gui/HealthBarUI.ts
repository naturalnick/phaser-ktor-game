import { Scene } from "phaser";

export class HealthBarUI {
	private scene: Scene;
	private healthBar: Phaser.GameObjects.Graphics;

	constructor(scene: Scene) {
		this.scene = scene;
		this.healthBar = scene.add.graphics();
		this.healthBar.setScrollFactor(0, 0); // Keep it fixed on screen
	}

	public update(currentHealth: number, maxHealth: number): void {
		this.healthBar.clear();

		this.healthBar.fillStyle(0x000000, 0.5);
		this.healthBar.fillRect(10, 10, 104, 12);

		const healthPercentage = currentHealth / maxHealth;
		const color = 0xff0000;
		this.healthBar.fillStyle(color, 1);
		this.healthBar.fillRect(12, 12, 100 * healthPercentage, 8);
	}

	public getContainer(): Phaser.GameObjects.Graphics {
		return this.healthBar;
	}

	public destroy(): void {
		this.healthBar.destroy();
	}
}
