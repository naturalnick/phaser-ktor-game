import { Scene } from "phaser";
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
					this.handleTransition(onOverlap);
				}
			},
			undefined,
			this
		);
	}

	private handleTransition(callback?: () => void): void {
		// Launch fade transition scene
		this.scene.scene.launch("FadeTransition", {
			targetScene: "Game",
			targetMap: this.transitionData.targetMap,
			playerPosition: this.transitionData.playerPosition,
			fadeColor: this.transitionData.fadeColor,
			duration: this.transitionData.duration,
		});

		if (callback) {
			callback();
		}
	}
}
