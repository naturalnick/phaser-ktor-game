export interface PlayerSaveData {
	health: {
		current: number;
		max: number;
	};
	position: {
		x: number;
		y: number;
		map: string;
	};
	inventory: {
		items: { key: string; count: number }[];
	};
	// Add other save properties as needed
}

export interface EnemySaveData {
	id: number;
	x: number;
	y: number;
}

export interface ItemSaveData {
	x: number;
	y: number;
	key: string;
}

export interface MapSaveData {
	enemies: EnemySaveData[];
	items: ItemSaveData[];
}

export interface GameSaveData {
	player: PlayerSaveData;
	maps: {
		[key: string]: MapSaveData;
	};
	version: string;
	timestamp: number;
}
