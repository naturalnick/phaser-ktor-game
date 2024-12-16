import { GameObjects, Scene } from "phaser";

export class MainMenu extends Scene {
	title: GameObjects.Text;

	constructor() {
		super("MainMenu");
	}

	create() {
		this.title = this.add
			.text(this.scale.width / 2, this.scale.height / 2, "Main Menu", {
				fontFamily: "Arial Black",
				fontSize: 38,
				color: "#ffffff",
				stroke: "#000000",
				strokeThickness: 8,
				align: "center",
			})
			.setOrigin(0.5);

		// this.input.once("pointerdown", () => {
		this.scene.start("Game");
		// });
	}
}
