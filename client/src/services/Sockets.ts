import { Scene } from "phaser";
import { OtherPlayer } from "../entities/OtherPlayer";
import { EnemyManager } from "../managers/EnemyManager";
import { MultiplayerManager } from "../managers/MultiplayerManager";
import { UIManager } from "../managers/UIManager";

export class WebSocketService {
	private socket: WebSocket;
	private scene: Scene;
	private messageHandlers: ((playerId: string, message: string) => void)[] =
		[];
	private uiManager: UIManager;
	private isEnemyHost: boolean = false;
	private enemyUpdateInterval: number | null = null;
	private playerManager: MultiplayerManager;

	constructor(
		scene: Scene,
		uiManager: UIManager,
		multiplayerManager: MultiplayerManager
	) {
		this.scene = scene;
		this.uiManager = uiManager;
		this.playerManager = multiplayerManager;

		const playerId = Math.floor(Math.random() * 100).toString();
		this.socket = new WebSocket(`ws://localhost:8080/game?id=${playerId}`);
		this.setupSocketListeners();
	}

	private setupSocketListeners(): void {
		this.socket.onmessage = (event) => {
			const [action, playerId, ...params] = event.data.split("|");

			switch (action) {
				case "join":
					this.handlePlayerJoin(
						playerId,
						parseFloat(params[0]),
						parseFloat(params[1])
					);
					break;
				case "chat":
					this.handleChatMessage(playerId, params[0]);
					break;
				case "move":
					this.handlePlayerMove(
						playerId,
						parseFloat(params[0]),
						parseFloat(params[1])
					);
					break;
				case "enemyHost":
					this.handleEnemyHostAssignment(playerId);
					break;
				case "enemyUpdate":
					this.handleEnemyUpdate(playerId);
					break;
				case "leave":
					this.handlePlayerLeave(playerId);
					break;
			}
		};
	}

	private handlePlayerJoin(playerId: string, x: number, y: number): void {
		if (!this.playerManager.players.has(playerId)) {
			const newPlayer = new OtherPlayer(this.scene, x, y);
			this.playerManager.players.set(playerId, newPlayer);

			const enemyManager = this.scene.registry.get(
				"enemyManager"
			) as EnemyManager;
			enemyManager.updatePlayerPosition(playerId, x, y);

			this.uiManager.updateIgnoreList();
		}
	}

	private handlePlayerMove(playerId: string, x: number, y: number): void {
		if (!this.playerManager.players.has(playerId)) {
			this.handlePlayerJoin(playerId, x, y);
			return;
		}

		const player = this.playerManager.players.get(playerId);
		if (player) {
			player.moveTo(x, y);

			const enemyManager = this.scene.registry.get(
				"enemyManager"
			) as EnemyManager;
			enemyManager.updatePlayerPosition(playerId, x, y);
		}
	}

	private handlePlayerLeave(playerId: string): void {
		const player = this.playerManager.players.get(playerId);
		if (player) {
			player.destroy();
			this.playerManager.players.delete(playerId);

			const enemyManager = this.scene.registry.get(
				"enemyManager"
			) as EnemyManager;
			enemyManager.removePlayer(playerId);
		}
	}

	private handleChatMessage(playerId: string, message: string): void {
		this.messageHandlers.forEach((handler) => handler(playerId, message));
	}

	public onChatMessage(
		handler: (playerId: string, message: string) => void
	): void {
		this.messageHandlers.push(handler);
	}

	public offChatMessage(
		handler: (playerId: string, message: string) => void
	): void {
		const index = this.messageHandlers.indexOf(handler);
		if (index > -1) {
			this.messageHandlers.splice(index, 1);
		}
	}

	public sendPosition(x: number, y: number, mapId: string): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`move|${x}|${y}|${mapId}`);
		}
	}

	public sendMessage(message: string, mapId: string): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`chat|${message}|${mapId}`);
		}
	}

	public initializeConnection(x: number, y: number, mapId: string): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`join|${x}|${y}|${mapId}`);
		} else {
			this.socket.onopen = () => {
				this.socket.send(`join|${x}|${y}|${mapId}`);
			};
		}
	}

	private handleEnemyHostAssignment(hostId: string): void {
		const enemyManager = this.scene.registry.get(
			"enemyManager"
		) as EnemyManager;
		if (!enemyManager) return;

		const isHost = hostId === this.socket.url.split("id=")[1];
		this.isEnemyHost = isHost;

		if (isHost) {
			this.startEnemyBroadcast(enemyManager);
			enemyManager.setHostControl(isHost);
		} else {
			this.stopEnemyBroadcast();
		}
	}

	private handleEnemyUpdate(enemyData: string): void {
		if (this.isEnemyHost) return;

		const enemyManager = this.scene.registry.get(
			"enemyManager"
		) as EnemyManager;
		if (!enemyManager) return;

		try {
			const enemies = JSON.parse(enemyData);
			enemyManager.updateEnemyPositions(enemies);
		} catch (e) {
			console.error("Error parsing enemy data:", e);
		}
	}

	private startEnemyBroadcast(enemyManager: EnemyManager): void {
		// Broadcast enemy positions every 100ms
		this.enemyUpdateInterval = window.setInterval(() => {
			if (this.socket.readyState === WebSocket.OPEN) {
				const enemyData = enemyManager.getEnemySaveData();
				const currentMapId = this.scene.registry.get("currentMapId");
				this.socket.send(
					`enemyUpdate|${JSON.stringify({
						mapId: currentMapId,
						enemies: enemyData,
					})}`
				);
			}
		}, 100);
	}

	private stopEnemyBroadcast(): void {
		if (this.enemyUpdateInterval !== null) {
			clearInterval(this.enemyUpdateInterval);
			this.enemyUpdateInterval = null;
		}
	}

	public destroy(): void {
		this.stopEnemyBroadcast();
		this.socket.close();
		this.playerManager.players.forEach((player) => player.destroy());
		this.playerManager.players.clear();
		this.messageHandlers = [];
	}
}
