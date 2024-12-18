export interface ConsumableEffect {
	type: "health";
	value: number;
}

export interface ItemData {
	key: string;
	name: string;
	maxStack: number;
	sprite: string;
	scale?: number;
	consumable?: boolean;
	equipable?: boolean;
	effects?: ConsumableEffect[];
}

export const ITEM_DATABASE: { [key: string]: ItemData } = {
	shroom: {
		key: "shroom",
		name: "Mushroom",
		maxStack: 99,
		sprite: "shroom",
		scale: 0.5,
		consumable: true,
		effects: [{ type: "health", value: 20 }],
	},
	sword: {
		key: "sword",
		name: "Sword",
		maxStack: 1,
		sprite: "shroom",
		scale: 0.5,
		consumable: true,
		effects: [{ type: "health", value: 20 }],
	},
};
