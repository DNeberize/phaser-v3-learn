import type {BallImageType} from "../../components/games/plinko/scenes/gameScene/components/plinkoDropBall.ts";

export type PlinkoHistoryItemType = {
    id: string;
    time: string;
    totalBet: number;
    payout: number;
    // Multiplier before the fruit-match bonus
    baseMultiplier?: number;
    // Set when the ball's fruit matched the multiplier's fruit
    bonusFruit?: BallImageType;
    profit: number;
    createdAt: number;
}