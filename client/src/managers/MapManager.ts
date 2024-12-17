import { Scene } from "phaser";
import { TransitionManager } from "./TransitionManager";

export class MapManager {
	private scene: Scene;
	private map: Phaser.Tilemaps.Tilemap | null;
	private tilesets: Map<string, Phaser.Tilemaps.Tileset>;
	private layers: Map<string, Phaser.Tilemaps.TilemapLayer>;
	private transitionManager: TransitionManager;
	private currentMapId: string | null;
	private isLoading: boolean;

	constructor(scene: Scene) {
		this.scene = scene;
		this.map = null;
		this.tilesets = new Map();
		this.layers = new Map();
		this.transitionManager = new TransitionManager(scene);
		this.currentMapId = null;
		this.isLoading = false;
	}

	public preload(): void {
		this.scene.load.image("tiles", "assets/tilesets/rpg_tileset.png");
		this.scene.load.image("tiles2", "assets/tilesets/hyptosis_tiles_1.png");
	}

	public async loadMap(mapId: string): Promise<void> {
		if (this.isLoading) {
			throw new Error("Map is already loading");
		}

		try {
			this.isLoading = true;

			// Clean up existing map if any
			this.destroy();

			if (!this.scene.cache.tilemap.exists(mapId)) {
				this.scene.load.tilemapTiledJSON(
					mapId,
					`assets/maps/${mapId}.tmj`
				);
				await new Promise<void>((resolve) => {
					this.scene.load.once("complete", () => resolve());
					this.scene.load.start();
				});
			}

			this.map = this.scene.make.tilemap({ key: mapId });
			if (!this.map) {
				throw new Error("Failed to create tilemap");
			}

			const groundTileset = this.map.addTilesetImage("Ground", "tiles");
			const hyptosisTileset = this.map.addTilesetImage(
				"hyptosis_tiles_1",
				"tiles2"
			);

			if (!groundTileset || !hyptosisTileset) {
				throw new Error("Failed to load tilesets");
			}

			const groundLayer = this.map.createLayer(
				"Tile Layer 1",
				[groundTileset, hyptosisTileset],
				0,
				0
			);

			if (groundLayer) {
				groundLayer.setCollisionByProperty({ collides: true });

				this.layers.set("Tile Layer 1", groundLayer);
			}

			await this.loadTransitions();

			this.currentMapId = mapId;
		} catch (error) {
			this.destroy();
			console.error("Error loading map:", error);
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	public getLayer(name: string): Phaser.Tilemaps.TilemapLayer | undefined {
		return this.layers.get(name);
	}

	public getLayers(): Map<string, Phaser.Tilemaps.TilemapLayer> {
		return this.layers;
	}

	public getCollisionLayers(): Phaser.Tilemaps.TilemapLayer[] {
		return Array.from(this.layers.values()).filter(
			(layer) => layer.collisionMask
		);
	}

	private async loadTransitions(): Promise<void> {
		if (!this.map) return;

		const transitionsLayer = this.map.getObjectLayer("Transitions");

		if (!transitionsLayer) return;

		this.transitionManager.loadFromTiledLayer(transitionsLayer);
	}

	public setupPlayerTransitions(player: Phaser.GameObjects.GameObject): void {
		this.transitionManager.setupPlayerTransitions(player);
	}

	public getCurrentMapId(): string | null {
		return this.currentMapId;
	}

	public getCurrentMap(): Phaser.Tilemaps.Tilemap | null {
		return this.map;
	}

	public getMapBounds(): { width: number; height: number } | null {
		if (!this.map) return null;
		return {
			width: this.map.widthInPixels,
			height: this.map.heightInPixels,
		};
	}

	public destroy(): void {
		this.layers.forEach((layer) => layer.destroy());
		this.layers.clear();
		this.tilesets.clear();
		if (this.map) {
			this.map.destroy();
		}
		this.map = null;
		this.currentMapId = null;
	}
}
