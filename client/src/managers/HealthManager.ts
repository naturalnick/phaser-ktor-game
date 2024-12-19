import { Scene } from "phaser";

export interface HealthManagerEvents {
	onDamage?: (amount: number) => void;
	onHeal?: (amount: number) => void;
	onDeath?: () => void;
	onChange?: (current: number, max: number) => void;
}

export class HealthManager {
	private currentHealth: number;
	private maxHealth: number;
	private readonly scene: Scene;
	private readonly events: HealthManagerEvents;

	constructor(scene: Scene, maxHealth: number, events?: HealthManagerEvents) {
		this.scene = scene;
		this.maxHealth = maxHealth;
		this.currentHealth = maxHealth;
		this.events = events || {};
	}

	public getCurrentHealth(): number {
		return this.currentHealth;
	}

	public getMaxHealth(): number {
		return this.maxHealth;
	}

	public getHealthPercentage(): number {
		return (this.currentHealth / this.maxHealth) * 100;
	}

	public setHealth(value: number): void {
		const oldHealth = this.currentHealth;
		this.currentHealth = Math.max(0, Math.min(this.maxHealth, value));

		if (oldHealth !== this.currentHealth) {
			this.events.onChange?.(this.currentHealth, this.maxHealth);
		}

		if (this.currentHealth <= 0) {
			this.events.onDeath?.();
		}
	}

	public heal(amount: number): void {
		if (amount > 0 && this.currentHealth < this.maxHealth) {
			this.setHealth(this.currentHealth + amount);
			this.events.onHeal?.(amount);
		}
	}

	public damage(amount: number): void {
		if (amount > 0) {
			this.setHealth(this.currentHealth - amount);
			this.events.onDamage?.(amount);
		}
	}

	public setMaxHealth(value: number): void {
		this.maxHealth = value;
		this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
		this.events.onChange?.(this.currentHealth, this.maxHealth);
	}

	public reset(): void {
		this.currentHealth = this.maxHealth;
		this.events.onChange?.(this.currentHealth, this.maxHealth);
	}
}
