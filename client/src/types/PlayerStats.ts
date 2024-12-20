export interface PlayerStats {
	baseHealth: number;
	attackCooldown?: number;
	attackRange?: number;
	attackDamage?: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
	baseHealth: 100,
};
