import { Scene } from "phaser";
import {
	CameraConfig,
	CameraController,
} from "../controllers/CameraController";
import { Player } from "../entities/Player";
import { ChatUI } from "../gui/ChatUI";
import { MapManager } from "../managers/MapManager";
import { UIManager } from "../managers/UIManager";
import { WebSocketService } from "../services/Sockets";

export class Game extends Scene {
	private webSocketService!: WebSocketService;
	private cameraController!: CameraController;
	private mapManager!: MapManager;
	private player!: Player;
	private uiManager!: UIManager;
	private chatUI!: ChatUI;

	constructor() {
		super("Game");
	}

	preload(): void {
		this.load.spritesheet(
			"player",
			"https://labs.phaser.io/assets/sprites/dude.png",
			{ frameWidth: 32, frameHeight: 48 }
		);
		this.mapManager = new MapManager(this);
		this.mapManager.preload();
	}

	async create(): Promise<void> {
		const sceneData = this.scene.settings.data as {
			targetMap?: string;
			playerPosition?: { x: number; y: number };
		};

		await this.mapManager.loadMap(sceneData?.targetMap || "map5");
		const mapBounds = this.mapManager.getMapBounds();

		if (mapBounds) {
			const playerPos = sceneData?.playerPosition || {
				x:
					this.scale.width < mapBounds.width
						? this.scale.width / 2
						: mapBounds.width / 2,
				y:
					this.scale.height < mapBounds.height
						? this.scale.height / 2
						: mapBounds.height / 2,
			};

			this.player = new Player(this, playerPos.x, playerPos.y);

			this.uiManager = new UIManager(this);

			this.webSocketService = new WebSocketService(this, this.uiManager);
			this.webSocketService.initializeConnection(
				playerPos.x,
				playerPos.y,
				"map5"
			);

			// const exitTrigger = new TransitionTrigger(
			// 	this,
			// 	1, // x position
			// 	1, // y position
			// 	32, // width
			// 	32, // height
			// 	{
			// 		targetMap: "map4",
			// 		playerPosition: { x: 200, y: 200 },
			// 		fadeColor: 0x000000,
			// 		duration: 500,
			// 	}
			// );
			// exitTrigger.addOverlapWith(this.player.getSprite());

			this.chatUI = new ChatUI(
				this,
				{
					width: Math.min(300, this.scale.width * 0.3),
					height: Math.min(200, this.scale.height * 0.3),
				},
				this.webSocketService
			);

			this.uiManager.getUIContainer().add(this.chatUI.getContainer());

			this.mapManager.setupPlayerTransitions(this.player.getSprite());

			const collisionLayers = this.mapManager.getCollisionLayers();
			collisionLayers.forEach((layer) => {
				this.physics.add.collider(this.player.getSprite(), layer);
			});

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
			this.cameraController.startFollow(this.player.getSprite());

			this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
				this.cameraController.setupCamera(cameraConfig);

				this.chatUI.handleResize(gameSize);
			});

			this.physics.world.setBounds(
				-32,
				-32,
				mapBounds.width + 64,
				mapBounds.height + 64
			);
		}
	}

	update(): void {
		this.player?.update();

		if (
			this.player &&
			(this.player.getVelocity().x !== 0 ||
				this.player.getVelocity().y !== 0)
		) {
			const sprite = this.player.getSprite();
			console.log(sprite.x, sprite.y);
			this.webSocketService.sendPosition(
				sprite.x,
				sprite.y,
				this.mapManager.getCurrentMapId()!
			);
		}
	}

	destroy(): void {
		this.webSocketService?.destroy();
	}
}
