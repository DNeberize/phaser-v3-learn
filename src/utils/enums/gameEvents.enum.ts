// Const object instead of a TS enum: enums aren't allowed with 'erasableSyntaxOnly'
export const GameEventsEnum = {
    START_GAME: 'startGame',
    GAME_LOADED: 'gameLoaded',
    DROP_BALL: 'dropBall',
    BALL_DROPPED: 'ballDropped',
    CHANGE_ROWS: 'changeRows',
} as const;

export type GameEventsEnum = typeof GameEventsEnum[keyof typeof GameEventsEnum];
