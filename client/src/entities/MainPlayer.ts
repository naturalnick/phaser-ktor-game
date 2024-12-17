import { Scene, Types } from "phaser";
import { InventoryManager } from "../managers/InventoryManager";
import { UIManager } from "../managers/UIManager";
import { ITEM_DATABASE } from "../types/Item";
import { BasePlayer } from "./Player";
import { WorldItem } from "./WorldItem";

export class MainPlayer extends BasePlayer {
	private cursors: Types.Input.Keyboard.CursorKeys;
	private inventory: InventoryManager;
	private uiManager: UIManager;
	private interactKey: Phaser.Input.Keyboard.Key;
	private dropKey: Phaser.Input.Keyboard.Key;
	private useKey: Phaser.Input.Keyboard.Key;

	private maxHealth: number = 100;
	private currentHealth: number = 100;

	constructor(scene: Scene, x: number, y: number, uiManager: UIManager) {
		super(scene, x, y);
		this.uiManager = uiManager;
		this.inventory = new InventoryManager(10);

		if (scene.input.keyboard) {
			this.cursors = scene.input.keyboard.createCursorKeys();
			this.interactKey = scene.input.keyboard.addKey("E");
			this.dropKey = scene.input.keyboard.addKey("Q");
			this.useKey = scene.input.keyboard.addKey("F");
		}

		this.setupItemInteraction();
		this.updateUI();
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

	public getVelocity(): Phaser.Math.Vector2 {
		return this.sprite.body?.velocity ?? new Phaser.Math.Vector2();
	}

	private updateUI(): void {
		this.uiManager.updateHealthBar(this.currentHealth, this.maxHealth);
		this.updateInventoryUI();
	}

	public setHealth(value: number): void {
		this.currentHealth = Math.max(0, Math.min(this.maxHealth, value));
		this.updateUI();

		if (this.currentHealth <= 0) {
			this.onDeath();
		}
	}

	public heal(amount: number): void {
		this.setHealth(this.currentHealth + amount);
	}

	public damage(amount: number): void {
		this.setHealth(this.currentHealth - amount);
	}

	private onDeath(): void {
		console.log("Player died!");
	}

	private setupItemInteraction(): void {
		this.interactKey.on("down", () => this.tryPickupItem());
		this.dropKey.on("down", () => this.tryDropItem());
		this.useKey.on("down", () => this.tryUseItem());
	}

	private tryPickupItem(): void {
		const nearbyItems = this.scene.physics.overlapCirc(
			this.sprite.x,
			this.sprite.y,
			32
		);

		for (const body of nearbyItems) {
			if (body.gameObject instanceof WorldItem) {
				const worldItem = body.gameObject as WorldItem;
				const itemKey = worldItem.getItemKey();

				if (this.inventory.addItem(itemKey)) {
					worldItem.destroy();
					this.updateInventoryUI();
					break;
				}
			}
		}
	}

	private tryDropItem(): void {
		const selectedSlot = this.uiManager.getInventoryUI().getSelectedSlot();
		const droppedItemKey = this.inventory.removeItem(selectedSlot, 1);

		if (droppedItemKey) {
			const offsetX = Math.random() * 40 - 20;
			const offsetY = Math.random() * 40 - 20;

			new WorldItem(
				this.scene,
				this.sprite.x + offsetX,
				this.sprite.y + offsetY,
				droppedItemKey
			);

			this.updateInventoryUI();
		}
	}

	private tryUseItem(): void {
		const selectedSlot = this.uiManager.getInventoryUI().getSelectedSlot();
		const slot = this.inventory.getSlots()[selectedSlot];

		if (slot.itemKey) {
			const itemData = ITEM_DATABASE[slot.itemKey];

			if (itemData.consumable && itemData.effects) {
				let consumed = false;

				for (const effect of itemData.effects) {
					switch (effect.type) {
						case "health":
							if (this.currentHealth < this.maxHealth) {
								this.heal(effect.value);
								consumed = true;
							}
							break;
					}
				}

				if (consumed) {
					this.inventory.removeItem(selectedSlot, 1);
					this.updateInventoryUI();
				}
			}
		}
	}

	private updateInventoryUI(): void {
		const inventoryUI = this.uiManager.getInventoryUI();
		const slots = this.inventory.getSlots();

		slots.forEach((slot, index) => {
			if (slot.itemKey) {
				inventoryUI.setItem(index, slot.itemKey, slot.count);
			} else {
				inventoryUI.setItem(index, "", 0);
			}
		});
	}

	public destroy(): void {
		super.destroy();
		this.interactKey.destroy();
		this.dropKey.destroy();
		this.useKey.destroy();
	}
}
