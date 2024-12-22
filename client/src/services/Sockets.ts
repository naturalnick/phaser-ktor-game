import { Scene } from "phaser";
import { OtherPlayer } from "../entities/OtherPlayer";
import { EnemyManager } from "../managers/EnemyManager";
import { MultiplayerManager } from "../managers/MultiplayerManager";
import { UIManager } from "../managers/UIManager";
import { EnemySaveData } from "../types/SaveData";

export class WebSocketService {
	private socket: WebSocket;
	private scene: Scene;
	private messageHandlers: ((playerId: string, message: string) => void)[] =
		[];
	private uiManager: UIManager;
	private isEnemyHost: boolean = false;
	private enemyUpdateInterval: number | null = null;
	private playerManager: MultiplayerManager;
	private playerUpdateTime: number = 0;
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
			const data = JSON.parse(event.data) as GameMessage;

			switch (data.type) {
				case "PlayerJoin":
					this.handlePlayerJoin(data.id, data.x, data.y);
					break;
				case "ChatMessage":
					this.handleChatMessage(data.id, data.message);
					break;
				case "PlayerMove":
					this.handlePlayerMove(data.id, data.x, data.y);
					break;
				case "EnemyHost":
					this.handleEnemyHost(data.hostId);
					break;
				case "EnemyUpdate":
					this.handleEnemyUpdate(data.data);
					break;
				case "EnemyDamage":
					this.handleEnemyDamage(data.enemyId, data.damage);
					break;
				case "EnemyDeath":
					this.handleEnemyDeath(data.enemyId);
					break;
				case "PlayerLeave":
					this.handlePlayerLeave(data.id);
					break;
			}
		};
	}

	public sendPosition(x: number, y: number, mapId: string): void {
		const currentTime = Date.now();

		if (
			currentTime - this.playerUpdateTime >=
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
				this.playerUpdateTime = currentTime;
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
		console.log("PlayerId: ", joinMessage.id);
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(joinMessage));
		} else {
			this.socket.onopen = () => {
				this.socket.send(JSON.stringify(joinMessage));
			};
		}
	}

	public sendEnemyUpdate(enemyId: number, x: number, y: number): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			const message: EnemyUpdate = {
				type: "EnemyUpdate",
				id: this.getPlayerId(),
				data: {
					mapId: this.scene.registry.get("currentMapId"),
					enemy: {
						id: enemyId,
						x,
						y,
					},
				},
			};
			this.socket.send(JSON.stringify(message));
		}
	}

	public sendEnemyDamage(enemyId: number, damage: number): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			const message: EnemyDamage = {
				type: "EnemyDamage",
				playerId: this.getPlayerId(),
				mapId: this.scene.registry.get("currentMapId"),
				enemyId,
				damage,
			};
			this.socket.send(JSON.stringify(message));
		}
	}

	public sendEnemyDeath(enemyId: number): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			const message: EnemyDeath = {
				type: "EnemyDeath",
				playerId: this.getPlayerId(),
				mapId: this.scene.registry.get("currentMapId"),
				enemyId,
			};
			this.socket.send(JSON.stringify(message));
		}
	}

	public sendLeaveGame(): void {
		const leaveMessage: PlayerLeave = {
			type: "PlayerLeave",
			id: this.getPlayerId(),
		};
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(leaveMessage));
		}
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
			enemyManager.setHostControl(isHost);
		}
	}

	private handleEnemyUpdate(enemieData: {
		mapId: string;
		enemy: EnemySaveData;
	}): void {
		if (this.isEnemyHost) return;

		const enemyManager = this.scene.registry.get(
			"enemyManager"
		) as EnemyManager;
		if (!enemyManager) return;

		enemyManager.updateEnemyPosition(enemieData);
	}

	private handleEnemyDamage(enemyId: number, damage: number): void {
		const enemyManager = this.scene.registry.get(
			"enemyManager"
		) as EnemyManager;
		if (!enemyManager) return;

		enemyManager.damageEnemy(enemyId, damage);
	}

	private handleEnemyDeath(enemyId: number): void {
		const enemyManager = this.scene.registry.get(
			"enemyManager"
		) as EnemyManager;
		if (!enemyManager) return;

		enemyManager.removeEnemy(enemyId);
	}

	public closeConnection(): void {
		this.socket.close();
	}

	public destroy(): void {
		this.socket.close();
		this.playerManager.destroy();
		this.messageHandlers = [];
	}
}
