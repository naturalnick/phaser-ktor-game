import { Game, Types } from "phaser";
import { Boot } from "./scenes/Boot";
import { FadeTransition } from "./scenes/FadeTransition";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

const config: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	backgroundColor: "#000",
	pixelArt: true,
	width: window.innerWidth,
	height: window.innerHeight,
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: "arcade",
		arcade: {
			gravity: { x: 0, y: 0 },
			debug: true,
		},
	},
	scene: [Boot, Preloader, MainMenu, MainGame, FadeTransition, GameOver],
};

export default new Game(config);
