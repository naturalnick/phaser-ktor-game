export class DetectionManager {
	private sprite: Phaser.Physics.Arcade.Sprite;
	private _player?: Phaser.Physics.Arcade.Sprite;
	private _hasDetectedPlayer: boolean = false;
	private _lastTargetPosition?: { x: number; y: number };
	private detectionRadius: number;
	private escapeRadius: number;
	private _tileLayers?: Phaser.Tilemaps.TilemapLayer[];
	private playerPositions: Map<string, { x: number; y: number }> = new Map();

	set player(player: Phaser.Physics.Arcade.Sprite) {
		this._player = player;
	}

	get hasDetectedPlayer(): boolean {
		return this._hasDetectedPlayer;
	}

	get lastTargetPosition(): { x: number; y: number } | undefined {
		return this._lastTargetPosition;
	}

	set lastTargetPosition(position: { x: number; y: number } | undefined) {
		this._lastTargetPosition = position;
	}

	set tileLayers(layers: Phaser.Tilemaps.TilemapLayer[] | undefined) {
		this._tileLayers = layers;
	}

	constructor(
		sprite: Phaser.Physics.Arcade.Sprite,
		detectionRadius: number = 100,
		escapeRadius: number = 200
	) {
		this.sprite = sprite;
		this.detectionRadius = detectionRadius;
		this.escapeRadius = escapeRadius;
	}

	public updatePlayerPosition(id: string, x: number, y: number): void {
		this.playerPositions.set(id, { x, y });
	}

	public removePlayer(id: string): void {
		this.playerPositions.delete(id);
	}

	private hasLineOfSightToPosition(position: {
		x: number;
		y: number;
	}): boolean {
		if (!this._tileLayers) return false;

		const ray = new Phaser.Geom.Line(
			this.sprite.x,
			this.sprite.y,
			position.x,
			position.y
		);

		const tileWidth = this._tileLayers[0].tilemap.tileWidth;
		const tileHeight = this._tileLayers[0].tilemap.tileHeight;
		const points = ray.getPoints(0, Math.max(tileWidth, tileHeight));

		for (const point of points) {
			for (const layer of this._tileLayers) {
				const tile = layer.getTileAtWorldXY(point.x, point.y);
				if (tile && tile.collides) {
					return false;
				}
			}
		}
		return true;
	}

	private findNearestVisibleTarget():
		| { position: { x: number; y: number }; distance: number }
		| undefined {
		let nearestTarget:
			| { position: { x: number; y: number }; distance: number }
			| undefined;

		if (this._player) {
			const playerPos = { x: this._player.x, y: this._player.y };
			const distance = Phaser.Math.Distance.Between(
				this.sprite.x,
				this.sprite.y,
				playerPos.x,
				playerPos.y
			);

			if (
				distance <= this.escapeRadius &&
				this.hasLineOfSightToPosition(playerPos)
			) {
				nearestTarget = { position: playerPos, distance };
			}
		}

		this.playerPositions.forEach((pos) => {
			const distance = Phaser.Math.Distance.Between(
				this.sprite.x,
				this.sprite.y,
				pos.x,
				pos.y
			);

			if (
				distance <= this.escapeRadius &&
				this.hasLineOfSightToPosition(pos)
			) {
				if (!nearestTarget || distance < nearestTarget.distance) {
					nearestTarget = { position: pos, distance };
				}
			}
		});

		return nearestTarget;
	}

	public checkDetection(): void {
		const nearestTarget = this.findNearestVisibleTarget();

		if (nearestTarget) {
			const { position, distance } = nearestTarget;

			if (distance <= this.detectionRadius) {
				this._hasDetectedPlayer = true;
				this._lastTargetPosition = position;
			} else if (distance > this.escapeRadius) {
				this._hasDetectedPlayer = false;
				this._lastTargetPosition = undefined;
			}
		} else {
			this._hasDetectedPlayer = false;
			this._lastTargetPosition = undefined;
		}
	}

	public destroy(): void {
		this.playerPositions.clear();
		this._tileLayers = undefined;
		this._lastTargetPosition = undefined;
		this._hasDetectedPlayer = false;
	}
}
