export class DetectionManager {
	private sprite: Phaser.Physics.Arcade.Sprite;
	private _target: Phaser.Physics.Arcade.Sprite;
	private _hasDetectedPlayer: boolean = false;
	private _lastTargetPosition?: { x: number; y: number };
	private detectionRadius: number;
	private escapeRadius: number;
	private _tileLayers?: Phaser.Tilemaps.TilemapLayer[];

	set target(target: Phaser.Physics.Arcade.Sprite) {
		this._target = target;
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
		this.detectionRadius = detectionRadius || 200;
		this.escapeRadius = escapeRadius || 300;
	}

	private isPlayerDetected(): boolean {
		if (!this._target) return false;

		const distance = Phaser.Math.Distance.Between(
			this.sprite.x,
			this.sprite.y,
			this._target.x,
			this._target.y
		);

		if (distance > this.escapeRadius) {
			this._hasDetectedPlayer = false;
			return false;
		}

		if (distance <= this.detectionRadius || this._hasDetectedPlayer) {
			this._hasDetectedPlayer = true;
			return true;
		}

		return false;
	}

	private hasLineOfSight(): boolean {
		if (!this._target || !this._tileLayers) return false;

		const ray = new Phaser.Geom.Line(
			this.sprite.x,
			this.sprite.y,
			this._target.x,
			this._target.y
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

	public checkDetection(): void {
		if (!this._target) return;

		this._hasDetectedPlayer = this.isPlayerDetected();
		const hasLineOfSight = this.hasLineOfSight();

		if (this._hasDetectedPlayer && hasLineOfSight) {
			this._lastTargetPosition = {
				x: this._target.x,
				y: this._target.y,
			};
		}
	}
}
