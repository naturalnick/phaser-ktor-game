export interface ConsumableEffect {
	type: "health";
	value: number;
}

export interface ItemData {
	key: string;
	name: string;
	stackable: boolean;
	maxStack: number;
	sprite: string;
	scale?: number;
	consumable?: boolean;
	effects?: ConsumableEffect[];
}

export const ITEM_DATABASE: { [key: string]: ItemData } = {
	shroom: {
		key: "shroom",
		name: "Mushroom",
		stackable: true,
		maxStack: 99,
		sprite: "shroom",
		scale: 0.5,
		consumable: true,
		effects: [{ type: "health", value: 20 }],
	},
	// Add more items as needed
};
