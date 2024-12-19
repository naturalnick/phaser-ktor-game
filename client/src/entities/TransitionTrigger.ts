import { Scene } from "phaser";
import { EnemyManager } from "../managers/EnemyManager";
import { SaveManager } from "../managers/SaveManager";
import { TransitionData } from "../types/SceneTransition";

export class TransitionTrigger {
	private scene: Scene;
	private trigger: Phaser.GameObjects.Zone;
	private transitionData: TransitionData;
	private isTransitioning: boolean = false;

	constructor(
		scene: Scene,
		x: number,
		y: number,
		width: number,
		height: number,
		transitionData: TransitionData
	) {
		this.scene = scene;
		this.transitionData = transitionData;
		this.trigger = scene.add.zone(x, y, width, height);
		scene.physics.world.enable(this.trigger);
		const body = this.trigger.body as Phaser.Physics.Arcade.Body;
		body.setAllowGravity(false);
		body.moves = false;
	}

	public addOverlapWith(
		gameObject: Phaser.GameObjects.GameObject,
		onOverlap?: () => void
	): void {
		this.scene.physics.add.overlap(
			gameObject,
			this.trigger,
			() => {
				if (!this.isTransitioning) {
					this.isTransitioning = true;
					this.cleanupCurrentScene();
					this.handleTransition(onOverlap);
				}
			},
			undefined,
			this
		);
	}

	private cleanupCurrentScene(): void {
		// Get the enemy manager from the scene
		const enemyManager = (this.scene as any).enemyManager as EnemyManager;
		if (enemyManager) {
			SaveManager.saveEnemyState(this.scene);
			enemyManager.destroy();
		}

		// // You might want to clean up other managers/services here as well
		// const webSocketService = (this.scene as any).webSocketService;
		// if (webSocketService) {
		// 	webSocketService.destroy();
		// }
	}

	private handleTransition(callback?: () => void): void {
		console.log(`Transitioning to map: ${this.transitionData.targetMap}`);

		this.scene.scene.launch("FadeTransition", {
			targetScene: "Game",
			targetMap: this.transitionData.targetMap,
			playerPosition: this.transitionData.playerPosition,
			fadeColor: this.transitionData.fadeColor,
			duration: this.transitionData.duration,
			onComplete: () => {
				this.isTransitioning = false;

				if (callback) {
					callback();
				}
			},
		});
	}
}
