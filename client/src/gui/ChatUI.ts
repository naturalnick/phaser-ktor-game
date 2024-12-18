// gui/ChatUI.ts
import { Scene } from "phaser";
import { WebSocketService } from "../services/Sockets";
import { UIComponent } from "./UIComponent";

interface ChatUIConfig {
	width: number;
	height: number;
	x?: number;
	y?: number;
	maxMessages?: number;
	fontSize?: number;
	padding?: number;
}

export class ChatUI extends UIComponent {
	private background: Phaser.GameObjects.Rectangle;
	private messagesText: Phaser.GameObjects.Text;
	private inputBox: Phaser.GameObjects.Rectangle;
	private inputText: Phaser.GameObjects.Text;
	private messages: string[] = [];
	private config: ChatUIConfig;
	private isInputActive: boolean = false;
	private currentInput: string = "";
	private webSocketService: WebSocketService;

	constructor(
		scene: Scene,
		config: ChatUIConfig,
		webSocketService: WebSocketService
	) {
		super(scene);
		this.webSocketService = webSocketService;

		this.config = {
			maxMessages: 50,
			fontSize: 16,
			padding: 10,
			x: 10,
			y: scene.scale.height - config.height - 10,
			...config,
		};

		this.createChatUI();
		this.setupInputHandling();

		this.webSocketService.onChatMessage((playerId, message) => {
			this.addMessage(`Player ${playerId}: ${message}`);
		});
	}

	private createChatUI(): void {
		this.container.setPosition(this.config.x!, this.config.y!);

		this.background = this.scene.add
			.rectangle(
				0,
				0,
				this.config.width,
				this.config.height,
				0x000000,
				0.5
			)
			.setOrigin(0, 0);

		this.messagesText = this.scene.add
			.text(this.config.padding!, this.config.padding!, "", {
				fontSize: `${this.config.fontSize}px`,
				color: "#ffffff",
				wordWrap: {
					width: this.config.width - this.config.padding! * 2,
				},
			})
			.setOrigin(0, 0);

		this.inputBox = this.scene.add
			.rectangle(
				0,
				this.config.height - 30,
				this.config.width,
				30,
				0x333333
			)
			.setOrigin(0, 0);

		this.inputText = this.scene.add
			.text(this.config.padding!, this.config.height - 25, "", {
				fontSize: `${this.config.fontSize}px`,
				color: "#ffffff",
			})
			.setOrigin(0, 0);

		this.container.add([
			this.background,
			this.messagesText,
			this.inputBox,
			this.inputText,
		]);

		this.inputBox
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => {
				this.activateInput();
			});
	}

	private setupInputHandling(): void {
		this.scene.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (!this.isInputActive) return;

			if (event.key === "Enter") {
				this.sendMessage();
			} else if (event.key === "Escape") {
				this.deactivateInput();
			} else if (event.key === "Backspace") {
				this.currentInput = this.currentInput.slice(0, -1);
				this.updateInputText();
			} else if (event.key.length === 1) {
				this.currentInput += event.key;
				this.updateInputText();
			}
		});
	}

	private activateInput(): void {
		this.isInputActive = true;
		this.inputBox.setFillStyle(0x444444);
	}

	private deactivateInput(): void {
		this.isInputActive = false;
		this.currentInput = "";
		this.updateInputText();
		this.inputBox.setFillStyle(0x333333);
	}

	private updateInputText(): void {
		this.inputText.setText(this.currentInput);
	}

	private sendMessage(): void {
		if (this.currentInput.trim()) {
			const currentMapId = this.scene.data.get("currentMapId") || "map1";
			console.log(currentMapId);
			this.webSocketService.sendMessage(this.currentInput, currentMapId);

			this.addMessage(`You: ${this.currentInput}`);

			this.currentInput = "";
			this.updateInputText();
		}
		this.deactivateInput();
	}

	public addMessage(message: string): void {
		this.messages.push(message);
		if (this.messages.length > this.config.maxMessages!) {
			this.messages.shift();
		}
		this.updateMessages();
	}

	private updateMessages(): void {
		this.messagesText.setText(this.messages.join("\n"));
	}

	public handleResize(gameSize: Phaser.Structs.Size): void {
		this.container.setPosition(
			this.config.x!,
			gameSize.height - this.config.height - 10
		);
	}

	public destroy(): void {
		this.container.destroy();
		this.scene.input.keyboard?.off("keydown");
	}
}
