import { Scene, Types } from "phaser";
import { AttackManager } from "../managers/AttackManager";
import { EnemyManager } from "../managers/EnemyManager";
import { HealthManager } from "../managers/HealthManager";
import { InventoryManager } from "../managers/InventoryManager";
import { MapManager } from "../managers/MapManager";
import { SaveManager } from "../managers/SaveManager";
import { UIManager } from "../managers/UIManager";
import { WorldItemManager } from "../managers/WorldItemManager";
import { ITEM_DATABASE } from "../types/Item";
import { DEFAULT_PLAYER_STATS, PlayerStats } from "../types/PlayerStats";
import { PlayerSaveData } from "../types/SaveData";
import { BasePlayer } from "./Player";
import { WorldItem } from "./WorldItem";

type FacingDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

export class MainPlayer extends BasePlayer {
	private cursors: Types.Input.Keyboard.CursorKeys;
	private inventory: InventoryManager;
	private uiManager: UIManager;
	private mapManager: MapManager;
	private worldItemManager: WorldItemManager;
	private interactKey: Phaser.Input.Keyboard.Key;
	private dropKey: Phaser.Input.Keyboard.Key;
	private useKey: Phaser.Input.Keyboard.Key;
	private wKey: Phaser.Input.Keyboard.Key;
	private aKey: Phaser.Input.Keyboard.Key;
	private sKey: Phaser.Input.Keyboard.Key;
	private dKey: Phaser.Input.Keyboard.Key;
	private hKey: Phaser.Input.Keyboard.Key;
	private facingDirection: FacingDirection = "DOWN";
	private healthManager: HealthManager;
	private attackManager: AttackManager;
	private rangeIndicator: Phaser.GameObjects.Graphics;
	private showRange: boolean = true;

	constructor(
		scene: Scene,
		x: number,
		y: number,
		uiManager: UIManager,
		mapManager: MapManager,
		stats: PlayerStats = DEFAULT_PLAYER_STATS
	) {
		super(scene, x, y);
		this.uiManager = uiManager;
		this.mapManager = mapManager;
		this.inventory = new InventoryManager(10);
		this.worldItemManager = this.scene.registry.get("worldItemManager");
		this.healthManager = new HealthManager(scene, stats.baseHealth, {
			onChange: (current, max) => {
				this.uiManager.updateHealthBar(current, max);
			},
			onDeath: () => {
				this.onDeath();
			},
		});

		this.attackManager = new AttackManager(scene, this, {
			cooldown: stats.attackCooldown || 500,
			range: stats.attackRange || 40,
			damage: stats.attackDamage || 20,
		});

		this.createRangeIndicator();

		// Add key to toggle range visibility
		scene.input.keyboard?.addKey("R").on("down", () => {
			this.showRange = !this.showRange;
			if (!this.showRange) {
				this.rangeIndicator.clear();
			}
		});

		const enemyManager = scene.registry.get("enemyManager") as EnemyManager;

		scene.input.keyboard?.addKey("H").on("down", () => {
			enemyManager.toggleHealthBars();
			uiManager.updateIgnoreList();
		});

		if (scene.input.keyboard) {
			this.cursors = scene.input.keyboard.createCursorKeys();
			this.interactKey = scene.input.keyboard.addKey("E");
			this.dropKey = scene.input.keyboard.addKey("Q");
			this.useKey = scene.input.keyboard.addKey("F");
			this.wKey = scene.input.keyboard.addKey("W");
			this.aKey = scene.input.keyboard.addKey("A");
			this.sKey = scene.input.keyboard.addKey("S");
			this.dKey = scene.input.keyboard.addKey("D");
		}

		this.setupItemInteraction();
		this.updateUI();

		scene.events.on("playerDamaged", this.damage, this);
		scene.events.on("itemDropped", this.tryDropItem, this);
		scene.events.on("moveItems", this.handleMoveItems, this);
	}

	public loadSaveData(saveData: PlayerSaveData): void {
		this.healthManager = new HealthManager(
			this.scene,
			saveData.health.max,
			{
				onChange: (current, max) => {
					this.uiManager.updateHealthBar(current, max);
				},
				onDeath: () => {
					this.onDeath();
				},
			}
		);
		this.healthManager.setHealth(saveData.health.current);

		this.setPosition(saveData.position.x, saveData.position.y);

		saveData.inventory.items.forEach((item, slot) => {
			if (item.key) {
				this.inventory.setItem(slot, item.key, item.count);
			}
		});

		this.updateUI();
	}

	private setPosition(x: number, y: number): void {
		this._sprite.setPosition(x, y);
	}

	private updateVelocity(
		upPressed: boolean,
		downPressed: boolean,
		leftPressed: boolean,
		rightPressed: boolean
	): void {
		const SPEED = 160;
		const DIAGONAL_MODIFIER = 0.707; // 1/√2 to normalize diagonal movement

		let velocityX = 0;
		let velocityY = 0;

		// Calculate X velocity
		if (leftPressed) {
			velocityX = -SPEED;
			this._sprite.anims.play("left", true);
			this.facingDirection = "LEFT";
		} else if (rightPressed) {
			velocityX = SPEED;
			this._sprite.anims.play("right", true);
			this.facingDirection = "RIGHT";
		}

		// Calculate Y velocity
		if (upPressed) {
			velocityY = -SPEED;
			if (!leftPressed && !rightPressed) {
				this._sprite.anims.play("up", true);
			}
			this.facingDirection = "UP";
		} else if (downPressed) {
			velocityY = SPEED;
			if (!leftPressed && !rightPressed) {
				this._sprite.anims.play("down", true);
			}
			this.facingDirection = "DOWN";
		}

		// Apply diagonal movement normalization
		if (velocityX !== 0 && velocityY !== 0) {
			velocityX *= DIAGONAL_MODIFIER;
			velocityY *= DIAGONAL_MODIFIER;
		}

		// Apply velocities
		this._sprite.setVelocityX(velocityX);
		this._sprite.setVelocityY(velocityY);

		// Handle idle state
		if (
			!upPressed &&
			!downPressed &&
			!leftPressed &&
			!rightPressed &&
			!this.attackManager.isAttacking
		) {
			this._sprite.anims.pause();
		}
	}

	public getVelocity(): Phaser.Math.Vector2 {
		return this._sprite.body?.velocity ?? new Phaser.Math.Vector2();
	}

	private updateUI(): void {
		this.uiManager.updateHealthBar(
			this.healthManager.getCurrentHealth(),
			this.healthManager.getMaxHealth()
		);
		this.updateInventoryUI();
	}

	public heal(amount: number): void {
		this.healthManager.heal(amount);
	}

	public damage(amount: number): void {
		this.healthManager.damage(amount);
	}

	private onDeath(): void {
		console.log("Player died!");
		// Add any additional death logic here
	}

	private setupItemInteraction(): void {
		this.interactKey.on("down", () => this.tryPickupItem());
		this.dropKey.on("down", () => this.tryDropItem());
		this.useKey.on("down", () => this.tryUseItem());
	}

	private handleMoveItems(slotIndexFrom: number, slotIndexTo: number) {
		this.inventory.moveItems(slotIndexFrom, slotIndexTo);
		this.updateInventoryUI();
	}

	private tryPickupItem(): void {
		const nearbyItems = this.scene.physics.overlapCirc(
			this._sprite.x,
			this._sprite.y,
			16
		);

		for (const body of nearbyItems) {
			if (body.gameObject instanceof WorldItem) {
				const worldItem = body.gameObject as WorldItem;
				const itemKey = worldItem.getItemKey();

				if (this.inventory.addItem(itemKey)) {
					this.worldItemManager.removeItem(worldItem);
					this.updateInventoryUI();
					SaveManager.saveItemState(this.scene);
					break;
				}
			}
		}
	}

	private tryDropItem(slotIndex?: number): void {
		const selectedSlot = this.uiManager.getInventoryUI().getSelectedSlot();
		const droppedItemKey = this.inventory.removeItem(
			slotIndex || selectedSlot,
			1
		);

		if (droppedItemKey) {
			const dropX = this._sprite.x - this._sprite.width / 2;
			const dropY = this._sprite.y - this._sprite.height / 2;

			this.worldItemManager.dropItem(dropX, dropY, droppedItemKey);

			this.updateInventoryUI();
			this.uiManager.updateIgnoreList();
			SaveManager.saveItemState(this.scene);
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
							if (
								this.healthManager.getCurrentHealth() <
								this.healthManager.getMaxHealth()
							) {
								this.heal(effect.value);
								consumed = true;
							}
							break;
					}
				}

				if (consumed) {
					this.inventory.removeItem(selectedSlot, 1);
					SaveManager.saveGame(this.scene);
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

	public getHealthManager(): HealthManager {
		return this.healthManager;
	}

	public getInventory(): InventoryManager {
		return this.inventory;
	}

	public getCurrentMap(): string | null {
		return this.mapManager.getCurrentMapId();
	}

	public getFacingDirection(): FacingDirection {
		return this.facingDirection;
	}

	private createRangeIndicator(): void {
		this.rangeIndicator = this.scene.add.graphics();
		this.updateRangeIndicator();
	}

	// not currently accurate due to custom range offsets - keep to use later
	private updateRangeIndicator(): void {
		if (!this.rangeIndicator || !this.showRange) return;

		this.rangeIndicator.clear();

		// Semi-transparent blue circle
		this.rangeIndicator.lineStyle(2, 0x4444ff, 0.3);
		this.rangeIndicator.strokeCircle(
			this._sprite.x,
			this._sprite.y,
			this.attackManager.range
		);

		// Very faint fill
		this.rangeIndicator.fillStyle(0x4444ff, 0.1);
		this.rangeIndicator.fillCircle(
			this._sprite.x,
			this._sprite.y,
			this.attackManager.range
		);
	}

	public update(): void {
		if (!this.cursors || !this._sprite.body) return;

		const downPressed = this.cursors.down.isDown || this.sKey.isDown;
		const upPressed = this.cursors.up.isDown || this.wKey.isDown;
		const leftPressed = this.cursors.left.isDown || this.aKey.isDown;
		const rightPressed = this.cursors.right.isDown || this.dKey.isDown;

		this.updateVelocity(upPressed, downPressed, leftPressed, rightPressed);
		this.updateRangeIndicator();
	}

	public destroy(): void {
		super.destroy();
		this.interactKey.destroy();
		this.dropKey.destroy();
		this.useKey.destroy();
		this.wKey.destroy();
		this.aKey.destroy();
		this.sKey.destroy();
		this.dKey.destroy();
		this.attackManager.destroy();
		this.rangeIndicator.destroy();
	}
}
