import { Scene } from "phaser";
import { TransitionTrigger } from "../entities/TransitionTrigger";
import { TransitionData } from "../types/SceneTransition";

interface TiledTransitionObject {
	x: number;
	y: number;
	width: number;
	height: number;
	properties?: {
		name: string;
		value: any;
	}[];
}

export class TransitionManager {
	private scene: Scene;
	private transitions: TransitionTrigger[] = [];

	constructor(scene: Scene) {
		this.scene = scene;
	}

	public loadFromTiledLayer(layer: Phaser.Tilemaps.ObjectLayer): void {
		console.log("Loading transitions from layer:", layer);

		for (const obj of layer.objects) {
			const transitionObject = obj as TiledTransitionObject;
			const properties = this.parseTransitionProperties(transitionObject);

			if (properties) {
				const trigger = new TransitionTrigger(
					this.scene,
					transitionObject.x + transitionObject.width / 2,
					transitionObject.y + transitionObject.height / 2,
					transitionObject.width,
					transitionObject.height,
					properties
				);
				this.transitions.push(trigger);
			}
		}
	}

	private parseTransitionProperties(
		obj: TiledTransitionObject
	): TransitionData | null {
		if (!obj.properties) return null;

		const getProperty = (name: string) => {
			const prop = obj.properties?.find((p) => p.name === name);
			return prop ? prop.value : undefined;
		};

		const targetMap = getProperty("targetMap");
		const targetX = getProperty("targetX");
		const targetY = getProperty("targetY");
		const fadeColor = getProperty("fadeColor") || 0x000000;
		const duration = getProperty("duration") || 500;

		if (!targetMap || targetX === undefined || targetY === undefined) {
			console.warn("Transition object missing required properties:", obj);
			return null;
		}

		return {
			targetMap,
			playerPosition: { x: targetX, y: targetY },
			fadeColor,
			duration,
		};
	}

	public setupPlayerTransitions(player: Phaser.GameObjects.GameObject): void {
		this.transitions.forEach((trigger) => {
			trigger.addOverlapWith(player);
		});
	}

	public destroy(): void {
		this.transitions = [];
	}
}
