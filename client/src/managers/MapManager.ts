import { Scene } from "phaser";
import { TransitionManager } from "./TransitionManager";

interface Tileset {
	name: string;
	key: string;
}

interface LayerConfig {
	name: string;
	tilesets: string[];
	depth: number;
	properties: {
		collides?: boolean;
	};
}

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
		this.scene.load.image("tiles", "assets/tilesets/FG_Grounds.png");
		this.scene.load.image("tiles2", "assets/tilesets/FG_Forest_Summer.png");
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

			const tilesetConfig: Tileset[] = [
				{ name: "FG_Grounds", key: "tiles" },
				{ name: "FG_Forest_Summer", key: "tiles2" },
			];

			const tilesets = this.loadTilesets(tilesetConfig);

			const layerConfig: LayerConfig[] = [
				{
					name: "BaseLayer",
					tilesets: ["FG_Grounds"],
					depth: 0,
					properties: {},
				},
				{
					name: "MidLayer1",
					tilesets: ["FG_Grounds", "FG_Forest_Summer"],
					depth: 1,
					properties: {},
				},
				{
					name: "MidLayer2",
					tilesets: ["FG_Forest_Summer"],
					depth: 2,
					properties: { collides: true },
				},
				{
					name: "TopLayer",
					tilesets: ["FG_Forest_Summer"],
					depth: 4,
					properties: {},
				},
			];

			for (const config of layerConfig) {
				const layerTilesets = config.tilesets.map(
					(name) =>
						tilesets[name] ??
						(() => {
							throw new Error(`Tileset ${name} not found`);
						})()
				);

				const layer = this.map.createLayer(config.name, layerTilesets);

				if (layer) {
					layer.setDepth(config.depth);

					if (config.properties.collides) {
						layer.setCollisionByProperty({ collides: true });
					}

					this.layers.set(config.name, layer);
				}
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

	private loadTilesets(
		config: Tileset[]
	): Record<string, Phaser.Tilemaps.Tileset> {
		const tilesets: Record<string, Phaser.Tilemaps.Tileset> = {};

		for (const { name, key } of config) {
			const tileset = this.map?.addTilesetImage(name, key);
			if (!tileset) {
				throw new Error(`Failed to load tileset: ${name}`);
			}
			tilesets[name] = tileset;
		}

		return tilesets;
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
