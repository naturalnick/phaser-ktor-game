import { Scene } from "phaser";
import { OtherPlayer } from "../entities/OtherPlayer";
import { UIManager } from "../managers/UIManager";

export class WebSocketService {
	private socket: WebSocket;
	private scene: Scene;
	private otherPlayers: Map<string, OtherPlayer>;
	private messageHandlers: ((playerId: string, message: string) => void)[] =
		[];
	private uiManager: UIManager;

	constructor(scene: Scene, uiManager: UIManager) {
		this.scene = scene;
		this.otherPlayers = new Map();
		this.uiManager = uiManager;

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
				case "leave":
					this.handlePlayerLeave(playerId);
					break;
			}
		};
	}

	private handlePlayerJoin(playerId: string, x: number, y: number): void {
		if (!this.otherPlayers.has(playerId)) {
			const newPlayer = new OtherPlayer(this.scene, x, y);
			this.otherPlayers.set(playerId, newPlayer);
			this.uiManager.updateIgnoreList();
		}
	}

	private handlePlayerMove(playerId: string, x: number, y: number): void {
		if (!this.otherPlayers.has(playerId)) {
			this.handlePlayerJoin(playerId, x, y);
			return;
		}

		const player = this.otherPlayers.get(playerId);
		if (player) {
			player.moveTo(x, y);
		}
	}

	private handlePlayerLeave(playerId: string): void {
		const player = this.otherPlayers.get(playerId);
		if (player) {
			player.destroy();
			this.otherPlayers.delete(playerId);
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

	public destroy(): void {
		this.socket.close();
		this.otherPlayers.forEach((player) => player.destroy());
		this.otherPlayers.clear();
		this.messageHandlers = [];
	}
}
