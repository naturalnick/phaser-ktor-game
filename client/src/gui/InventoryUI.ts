import { Scene } from "phaser";
import { ITEM_DATABASE } from "../types/Item";
import { UIComponent } from "./UIComponent";

interface InventorySlot {
	container: Phaser.GameObjects.Container;
	background: Phaser.GameObjects.Rectangle;
	item?: Phaser.GameObjects.Sprite;
	count?: Phaser.GameObjects.Text;
	index: number;
}

interface InventoryUIConfig {
	x?: number;
	y?: number;
	slots?: number;
	slotSize?: number;
	padding?: number;
	spacing?: number;
}

export class InventoryUI extends UIComponent {
	private config: InventoryUIConfig;
	private slots: InventorySlot[] = [];
	private selectedSlotIndex: number = 0;
	private background: Phaser.GameObjects.Rectangle;
	private dragSprite?: Phaser.GameObjects.Sprite;
	private dragStartSlot: number = -1;

	constructor(scene: Scene, config: InventoryUIConfig = {}) {
		super(scene);

		const uiCamera = this.scene.cameras.getCamera("uiCamera");
		console.log(uiCamera?.width, scene.scale.width);
		if (!uiCamera) throw "No Camera";

		const totalWidth =
			(config.slots || 10) * (config.slotSize || 48) +
			((config.slots || 12) - 1) * (config.spacing || 4) +
			(config.padding || 8) * 2;
		const totalHeight = (config.slotSize || 48) + (config.padding || 8) * 2;

		this.config = {
			slots: 10,
			slotSize: 48,
			padding: 8,
			spacing: 4,
			x: uiCamera?.width - totalWidth - 10,
			y: uiCamera?.height - totalHeight - 10,
			...config,
		};

		this.createInventoryUI();
		this.setupKeyboardControls();
	}

	private createInventoryUI(): void {
		const totalWidth =
			this.config.slots! * this.config.slotSize! +
			(this.config.slots! - 1) * this.config.spacing! +
			this.config.padding! * 2;
		const totalHeight = this.config.slotSize! + this.config.padding! * 2;

		this.background = this.scene.add
			.rectangle(0, 0, totalWidth, totalHeight, 0x000000, 0.4)
			.setOrigin(0, 0);

		this.container.add(this.background);
		this.container.setPosition(this.config.x!, this.config.y!);

		for (let i = 0; i < this.config.slots!; i++) {
			const slot = this.createSlot(i);
			this.slots.push(slot);
			this.container.add(slot.container);
		}

		this.selectSlot(0);
	}

	private createSlot(index: number): InventorySlot {
		const x =
			this.config.padding! +
			index * (this.config.slotSize! + this.config.spacing!);
		const y = this.config.padding!;

		const container = this.scene.add.container(x, y);

		const background = this.scene.add
			.rectangle(
				0,
				0,
				this.config.slotSize!,
				this.config.slotSize!,
				0xc4a2a4,
				0.5
			)
			.setOrigin(0, 0)
			.setInteractive();

		background.on("pointerdown", () => {
			this.selectSlot(index);
		});

		background.on("pointerover", () => {
			background.setFillStyle(0xd4b2b4, 0.5);
		});

		background.on("pointerout", () => {
			background.setFillStyle(0xc4a2a4, 0.5);
		});

		container.add(background);

		return {
			container,
			background,
			index,
		};
	}

	private setupKeyboardControls(): void {
		this.scene.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			switch (event.key) {
				case "1":
					this.selectSlot(0);
					break;
				case "2":
					this.selectSlot(1);
					break;
				case "3":
					this.selectSlot(2);
					break;
				case "4":
					this.selectSlot(3);
					break;
				case "5":
					this.selectSlot(4);
					break;
				case "6":
					this.selectSlot(5);
					break;
				case "7":
					this.selectSlot(6);
					break;
				case "8":
					this.selectSlot(7);
					break;
				case "9":
					this.selectSlot(8);
					break;
			}
		});
	}

	public selectSlot(index: number): void {
		if (index < 0 || index >= this.slots.length) return;

		this.deselectSlots();
		this.selectedSlotIndex = index;
		this.slots[index].background.setStrokeStyle(2, 0xffffff);
	}

	public deselectSlots(): void {
		this.slots[this.selectedSlotIndex].background.setStrokeStyle();
	}

	public setItem(slot: number, itemKey: string, count: number = 1): void {
		if (slot < 0 || slot >= this.slots.length) return;

		const slotData = this.slots[slot];

		if (slotData.item) {
			slotData.item.destroy();
			slotData.item = undefined;
		}
		if (slotData.count) {
			slotData.count.destroy();
			slotData.count = undefined;
		}

		if (itemKey) {
			const itemData = ITEM_DATABASE[itemKey];
			if (!itemData) return;

			const spriteKey = itemData.sprite;

			const item = this.scene.add
				.sprite(4, 4, spriteKey)
				.setOrigin(0, 0)
				.setDisplaySize(
					this.config.slotSize! - 8,
					this.config.slotSize! - 8
				)
				.setInteractive({ draggable: true });

			item.setData("slotIndex", slot);

			// Setup drag events
			item.on("dragstart", (pointer: Phaser.Input.Pointer) => {
				const uiCamera = this.scene.cameras.getCamera("uiCamera");
				const xAdjustment = Math.max(
					0,
					(this.scene.scale.width - (uiCamera?.width ?? 0)) / 2
				);

				this.dragStartSlot = slot;

				this.dragSprite = this.scene.add
					.sprite(pointer.x - xAdjustment, pointer.y, spriteKey)
					.setDisplaySize(
						this.config.slotSize! - 8,
						this.config.slotSize! - 8
					)
					.setDepth(1000);

				// Hide the original item while dragging
				item.setAlpha(0.5);
			});

			item.on("drag", (pointer: Phaser.Input.Pointer) => {
				if (this.dragSprite) {
					const uiCamera = this.scene.cameras.getCamera("uiCamera");
					const xAdjustment = Math.max(
						0,
						(this.scene.scale.width - (uiCamera?.width ?? 0)) / 2
					);
					this.dragSprite.setPosition(
						pointer.x - xAdjustment,
						pointer.y
					);
				}
			});

			item.on("dragend", (pointer: Phaser.Input.Pointer) => {
				const uiCamera = this.scene.cameras.getCamera("uiCamera");
				const xAdjustment = Math.max(
					0,
					(this.scene.scale.width - (uiCamera?.width ?? 0)) / 2
				);
				const targetSlot = this.getSlotFromPosition(
					pointer.x - xAdjustment,
					pointer.y
				);

				if (targetSlot !== null && targetSlot !== this.dragStartSlot) {
					this.scene.events.emit(
						"moveItems",
						this.dragStartSlot,
						targetSlot
					);
				} else if (!this.isPointerOverInventory(pointer)) {
					this.scene.events.emit("itemDropped", this.dragStartSlot);
					this.setItem(this.dragStartSlot, "");
				}

				// Restore original item visibility
				item.setAlpha(1);

				// Clean up drag sprite
				if (this.dragSprite) {
					this.dragSprite.destroy();
					this.dragSprite = undefined;
				}
			});

			slotData.container.add(item);
			slotData.item = item;

			if (count > 1) {
				slotData.count = this.scene.add
					.text(
						this.config.slotSize! - 2,
						this.config.slotSize! - 2,
						count.toString(),
						{
							fontSize: "12px",
							color: "#ffffff",
							stroke: "#000000",
							strokeThickness: 4,
						}
					)
					.setOrigin(1, 1);

				slotData.container.add(slotData.count);
			}
		}
	}

	private getSlotFromPosition(x: number, y: number): number | null {
		const inventoryBounds = this.container.getBounds();

		if (!inventoryBounds.contains(x, y)) {
			return null;
		}

		// Calculate relative position within inventory
		const relativeX = x - this.container.x;
		const relativeY = y - this.container.y;

		// Calculate slot based on position
		const slotWidth = this.config.slotSize! + this.config.spacing!;
		const slotX = Math.floor(
			(relativeX - this.config.padding!) / slotWidth
		);

		// Check if within valid slot bounds
		if (
			slotX >= 0 &&
			slotX < this.config.slots! &&
			relativeY >= this.config.padding! &&
			relativeY <= this.config.padding! + this.config.slotSize!
		) {
			return slotX;
		}

		return null;
	}

	private isPointerOverInventory(pointer: Phaser.Input.Pointer): boolean {
		const inventoryBounds = this.container.getBounds();
		const uiCamera = this.scene.cameras.getCamera("uiCamera");
		const xAdjustment = Math.max(
			0,
			(this.scene.scale.width - (uiCamera?.width ?? 0)) / 2
		);
		inventoryBounds.setSize(
			inventoryBounds.width + 32,
			inventoryBounds.height + 32
		);
		return inventoryBounds.contains(pointer.x - xAdjustment, pointer.y);
	}

	public getSelectedSlot(): number {
		return this.selectedSlotIndex;
	}

	public handleResize(gameSize: Phaser.Structs.Size): void {
		const uiCamera = this.scene.cameras.getCamera("uiCamera");
		if (!uiCamera) return;

		const xPosition = uiCamera?.width - this.background.width - 10;
		const yPosition = uiCamera?.height - this.background.height - 10;

		this.container.setPosition(xPosition, yPosition);
	}

	public destroy(): void {
		if (this.dragSprite) {
			this.dragSprite.destroy();
		}
		this.slots.forEach((slot) => {
			if (slot.item) {
				slot.item.removeAllListeners();
			}
			slot.background.removeAllListeners();
			slot.background.disableInteractive();
		});
		this.scene.input.keyboard?.off("keydown");
		this.container.destroy();
	}
}
