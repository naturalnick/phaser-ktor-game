import { Scene } from "phaser";
import {
	CameraConfig,
	CameraController,
} from "../controllers/CameraController";
import { MainPlayer } from "../entities/MainPlayer";
import { TransitionTrigger } from "../entities/TransitionTrigger";
import { EnemyManager } from "../managers/EnemyManager";
import { MapManager } from "../managers/MapManager";
import { MultiplayerManager } from "../managers/MultiplayerManager";
import { SaveManager } from "../managers/SaveManager";
import { UIManager } from "../managers/UIManager";
import { WorldItemManager } from "../managers/WorldItemManager";
import { WebSocketService } from "../services/Sockets";

export class Game extends Scene {
	private webSocketService!: WebSocketService;
	private cameraController!: CameraController;
	private mapManager!: MapManager;
	private player!: MainPlayer;
	private uiManager!: UIManager;
	private enemyManager!: EnemyManager;
	private worldItemManager!: WorldItemManager;
	private playerManager!: MultiplayerManager;

	constructor() {
		super("Game");
	}

	preload(): void {
		this.load.image("slime", "assets/sprites/RPG_Monster_024_2.png");
		this.load.spritesheet(
			"player2",
			"assets/sprites/Character_016_Walk.png",
			{
				frameWidth: 16,
				frameHeight: 32,
			}
		);
		this.load.image("shroom", "https://p.novaskin.me/3123273216.png");

		this.mapManager = new MapManager(this);
		this.mapManager.preload();
	}

	async create(): Promise<void> {
		const sceneData = this.scene.settings.data as {
			targetMap?: string;
			playerPosition?: { x: number; y: number };
		};
		this.registry.set("currentMapId", sceneData?.targetMap || "map1");
		await this.mapManager.loadMap(sceneData?.targetMap || "map1");
		const mapBounds = this.mapManager.getMapBounds();

		if (mapBounds) {
			this.setupManagers(mapBounds);
			this.setupPlayer(mapBounds, sceneData?.playerPosition);

			const saveData = SaveManager.loadGame(this);
			if (saveData) {
				this.player.loadSaveData(saveData.player);
			}

			this.setupGame(saveData);
			this.setupEventListeners(mapBounds);
		}
	}

	private setupManagers(mapBounds: { width: number; height: number }): void {
		this.uiManager = new UIManager(this, {
			bounds: { width: mapBounds.width, height: mapBounds.height },
		});

		this.worldItemManager = new WorldItemManager(this);
		this.registry.set("worldItemManager", this.worldItemManager);

		this.enemyManager = new EnemyManager(this, this.mapManager);
		this.registry.set("enemyManager", this.enemyManager);

		this.playerManager = new MultiplayerManager(this);
		this.registry.set("playerManager", this.playerManager);
	}

	private setupPlayer(
		mapBounds: { width: number; height: number },
		playerPosition?: { x: number; y: number }
	): void {
		const playerPos = playerPosition || {
			x:
				this.scale.width < mapBounds.width
					? this.scale.width / 2
					: mapBounds.width / 2,
			y:
				this.scale.height < mapBounds.height
					? this.scale.height / 2
					: mapBounds.height / 2,
		};

		this.player = new MainPlayer(
			this,
			playerPos.x,
			playerPos.y,
			"player2",
			this.uiManager,
			this.mapManager
		);
		this.registry.set("player", this.player);
	}

	private setupGame(saveData?: any): void {
		this.mapManager.setupPlayerTransitions(this.player.sprite);

		this.enemyManager.initialize({
			player: this.player.sprite,
			collisionLayers: this.mapManager.getCollisionLayers(),
			saveData: saveData?.maps.map1.enemies,
		});

		this.webSocketService = new WebSocketService(
			this,
			this.uiManager,
			this.playerManager
		);
		this.webSocketService.initializeConnection(
			this.player.sprite.x,
			this.player.sprite.y,
			"map1"
		);

		const exitTrigger = new TransitionTrigger(this, 100, 300, 16, 16, {
			targetMap: "map1",
			playerPosition: { x: 200, y: 200 },
			fadeColor: 0x000000,
			duration: 500,
		});
		exitTrigger.addOverlapWith(this.player.sprite, () =>
			console.log("here")
		);

		this.uiManager.initializeChatUI(this.webSocketService);

		this.worldItemManager.loadItems(saveData?.maps.map1.items);
		this.uiManager.updateIgnoreList();

		const collisionLayers = this.mapManager.getCollisionLayers();
		collisionLayers.forEach((layer) => {
			this.physics.add.collider(this.player.sprite, layer);
		});
	}

	private setupEventListeners(mapBounds: {
		width: number;
		height: number;
	}): void {
		this.physics.world.setBounds(
			-16,
			-16,
			mapBounds.width + 32,
			mapBounds.height + 32
		);

		const cameraConfig: CameraConfig = {
			lerp: 0.1,
			bounds: {
				x: 0,
				y: 0,
				width: mapBounds.width,
				height: mapBounds.height,
			},
		};

		this.cameraController = new CameraController(this, cameraConfig);
		this.cameraController.startFollow(this.player.sprite);

		this.scale.on("resize", () => {
			this.cameraController.setupCamera(cameraConfig);
		});

		this.game.events.on("blur", () => {
			SaveManager.saveGame(this);
		});

		window.addEventListener("beforeunload", () => {
			SaveManager.saveGame(this);
			console.log("Window closed");
		});
	}

	update(): void {
		this.player?.update();
		this.enemyManager?.update();

		if (
			this.player &&
			(this.player.getVelocity().x !== 0 ||
				this.player.getVelocity().y !== 0)
		) {
			const sprite = this.player.sprite;
			this.webSocketService.sendPosition(
				sprite.x,
				sprite.y,
				this.mapManager.getCurrentMapId()!
			);
		}
	}

	destroy(): void {
		this.webSocketService?.destroy();
		this.enemyManager?.destroy();
		this.worldItemManager?.destroy();
	}
}
