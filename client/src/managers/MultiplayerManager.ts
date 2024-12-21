import { Scene } from "phaser";
import { OtherPlayer } from "../entities/OtherPlayer";

export class MultiplayerManager {
	private scene: Scene;
	private _players: Map<string, OtherPlayer> = new Map();

	get players(): Map<string, OtherPlayer> {
		return this._players;
	}

	constructor(scene: Scene) {
		this.scene = scene;
	}

	public destroy(): void {
		this.players.forEach((player) => player.destroy());
		this.players.clear();
	}
}
