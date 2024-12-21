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
	private playerUpdateInterval: number = 0;
	private readonly PLAYER_UPDATE_INTERVAL: number = 100;

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
			const message = JSON.parse(event.data) as GameMessage;

			switch (message.type) {
				case "PlayerJoin":
					this.handlePlayerJoin(message.id, message.x, message.y);
					break;
				case "ChatMessage":
					this.handleChatMessage(message.id, message.message);
					break;
				case "PlayerMove":
					this.handlePlayerMove(message.id, message.x, message.y);
					break;
				case "EnemyHost":
					this.handleEnemyHost(message.hostId);
					break;
				case "EnemyUpdate":
					this.handleEnemyUpdate(
						JSON.stringify(message.data.enemies)
					);
					break;
				case "PlayerLeave":
					this.handlePlayerLeave(message.id);
					break;
			}
		};
	}

	public sendPosition(x: number, y: number, mapId: string): void {
		const currentTime = Date.now();

		if (
			currentTime - this.playerUpdateInterval >=
			this.PLAYER_UPDATE_INTERVAL
		) {
			if (this.socket.readyState === WebSocket.OPEN) {
				const message: PlayerMove = {
					type: "PlayerMove",
					id: this.getPlayerId(),
					x,
					y,
					mapId,
				};
				this.socket.send(JSON.stringify(message));
				this.playerUpdateInterval = currentTime;
			}
		}
	}

	public sendMessage(message: string, mapId: string): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			const chatMessage: ChatMessage = {
				type: "ChatMessage",
				id: this.getPlayerId(),
				message,
				mapId,
			};
			this.socket.send(JSON.stringify(chatMessage));
		}
	}

	public initializeConnection(x: number, y: number, mapId: string): void {
		const joinMessage: PlayerJoin = {
			type: "PlayerJoin",
			id: this.getPlayerId(),
			x,
			y,
			mapId,
		};

		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(joinMessage));
		} else {
			this.socket.onopen = () => {
				this.socket.send(JSON.stringify(joinMessage));
			};
		}
	}

	private startEnemyBroadcast(enemyManager: EnemyManager): void {
		this.enemyUpdateInterval = window.setInterval(() => {
			if (this.socket.readyState === WebSocket.OPEN) {
				const enemyData = enemyManager.getEnemySaveData();
				const currentMapId = this.scene.registry.get("currentMapId");

				const message: EnemyUpdate = {
					type: "EnemyUpdate",
					id: this.getPlayerId(),
					data: {
						mapId: currentMapId,
						enemies: enemyData,
					},
				};

				this.socket.send(JSON.stringify(message));
			}
		}, 100);
	}

	// Helper method to get the player ID
	private getPlayerId(): string {
		return this.socket.url.split("id=")[1];
	}

	private handlePlayerJoin(playerId: string, x: number, y: number): void {
		if (!this.playerManager.players.has(playerId)) {
			const newPlayer = new OtherPlayer(this.scene, x, y, "player2", 15);
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

	private handleEnemyHost(hostId: string): void {
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

	private stopEnemyBroadcast(): void {
		if (this.enemyUpdateInterval !== null) {
			clearInterval(this.enemyUpdateInterval);
			this.enemyUpdateInterval = null;
		}
	}

	public closeConnection(): void {
		this.socket.close();
	}

	public destroy(): void {
		this.stopEnemyBroadcast();
		this.socket.close();
		this.playerManager.destroy();
		this.messageHandlers = [];
	}
}
