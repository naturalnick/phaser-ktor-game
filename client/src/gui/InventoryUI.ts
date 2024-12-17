import { Scene } from "phaser";
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

	constructor(scene: Scene, config: InventoryUIConfig = {}) {
		super(scene);

		const uiCamera = this.scene.cameras.getCamera("uiCamera");
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
			.setOrigin(0, 0);

		container.add(background);

		return {
			container,
			background,
			index,
		};
	}

	private setupKeyboardControls(): void {
		for (let i = 1; i <= Math.min(9, this.config.slots!); i++) {
			this.scene.input.keyboard?.on(`keydown-${i}`, () => {
				this.selectSlot(i - 1);
			});
		}
	}

	public selectSlot(index: number): void {
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
			slotData.item = this.scene.add
				.sprite(4, 4, itemKey)
				.setOrigin(0, 0)
				.setDisplaySize(
					this.config.slotSize! - 8,
					this.config.slotSize! - 8
				);
			slotData.container.add(slotData.item);

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
		this.scene.input.keyboard?.off("keydown");
		this.container.destroy();
	}
}
