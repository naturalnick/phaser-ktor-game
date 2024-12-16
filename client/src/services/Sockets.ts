import { Player } from "../entities/Player";
import { UIManager } from "../managers/UIManager";

export class WebSocketService {
	private socket: WebSocket;
	private scene: Phaser.Scene;
	private otherPlayers: Map<string, Phaser.GameObjects.Sprite>;
	private messageHandlers: ((playerId: string, message: string) => void)[] =
		[];
	private uiManager: UIManager;

	constructor(scene: Phaser.Scene, uiManager: UIManager) {
		this.scene = scene;
		this.otherPlayers = new Map();
		const playerId = Math.floor(Math.random() * 100).toString();
		this.socket = new WebSocket(`ws://localhost:8080/game?id=${playerId}`);
		this.setupSocketListeners();
		this.uiManager = uiManager;
	}

	private setupSocketListeners() {
		this.socket.onmessage = (event) => {
			const [action, playerId, ...params] = event.data.split("|");
			console.log(action, playerId, ...params);
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

	// RECEIVE SOCKET
	private handlePlayerJoin(playerId: string, x: number, y: number) {
		if (!this.otherPlayers.has(playerId)) {
			const newPlayer = new Player(this.scene, x, y);
			this.otherPlayers.set(playerId, newPlayer.getSprite());
			this.uiManager.updateIgnoreList();
		}
	}

	// RECEIVE SOCKET
	private handlePlayerMove(playerId: string, x: number, y: number) {
		if (!this.otherPlayers.has(playerId)) {
			this.handlePlayerJoin(playerId, x, y);
			return;
		}

		const player = this.otherPlayers.get(playerId);
		if (player) {
			this.scene.tweens.add({
				targets: player,
				x: x,
				y: y,
				duration: 100, // Duration in milliseconds
				ease: "Linear", // You can use different easing functions
				// ease: 'Cubic.easeOut' would give a more natural feel
			});
		}
	}

	// RECEIVE SOCKET
	private handlePlayerLeave(playerId: string) {
		const player = this.otherPlayers.get(playerId);
		if (player) {
			player.destroy();
			this.otherPlayers.delete(playerId);
		}
	}

	// RECEIVE SOCKET
	private handleChatMessage(playerId: string, message: string) {
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

	// SEND SOCKET
	public sendPosition(x: number, y: number, mapId: string) {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`move|${x}|${y}|${mapId}`);
		}
	}

	// SEND SOCKET
	public sendMessage(message: string, mapId: string) {
		if (this.socket.readyState === WebSocket.OPEN) {
			console.log("sending chat socket");
			this.socket.send(`chat|${message}|${mapId}`);
		}
	}

	// SEND SOCKET
	public initializeConnection(x: number, y: number, mapId: string) {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`join|${x}|${y}|${mapId}`);
		} else {
			this.socket.onopen = () => {
				console.log("sending join");
				this.socket.send(`join|${x}|${y}|${mapId}`);
			};
		}
	}

	public destroy() {
		this.socket.close();
		this.otherPlayers.forEach((player) => player.destroy());
		this.otherPlayers.clear();
		this.messageHandlers = [];
	}
}
