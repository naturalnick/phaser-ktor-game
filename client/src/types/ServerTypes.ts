interface PlayerMove {
	type: "PlayerMove";
	id: string;
	x: number;
	y: number;
	mapId: string;
}

interface PlayerJoin {
	type: "PlayerJoin";
	id: string;
	x: number;
	y: number;
	mapId: string;
}

interface PlayerLeave {
	type: "PlayerLeave";
	id: string;
}

interface ChatMessage {
	type: "ChatMessage";
	id: string;
	message: string;
	mapId: string;
}

interface EnemyUpdate {
	type: "EnemyUpdate";
	id: string;
	data: {
		mapId: string;
		enemy: {
			id: number;
			x: number;
			y: number;
		};
	};
}

interface EnemyDamage {
	type: "EnemyDamage";
	playerId: string;
	mapId: string;
	enemyId: number;
	damage: number;
}

interface EnemyDeath {
	type: "EnemyDeath";
	playerId: string;
	mapId: string;
	enemyId: number;
}

interface EnemyHost {
	type: "EnemyHost";
	hostId: string;
	mapId: string;
}

type GameMessage =
	| PlayerMove
	| PlayerJoin
	| PlayerLeave
	| ChatMessage
	| EnemyUpdate
	| EnemyDamage
	| EnemyDeath
	| EnemyHost;
