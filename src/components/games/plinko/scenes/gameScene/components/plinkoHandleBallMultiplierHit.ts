import type {PlinkoGameObjectsType, PlinkoGameSoundsType} from "../PlinkoGameScene.ts";
import {gameEvents} from "../../../../../../utils/gameEvents.ts";
import type {PlinkoHistoryItemType} from "../../../../../../utils/types/Plinko.type.ts";
import dayjs from "dayjs";
import {GameEventsEnum} from "../../../../../../utils/enums/gameEvents.enum.ts";
import {type BallImageType, FRUIT_BONUS_MULTIPLIERS} from "./plinkoDropBall.ts";

const TOTAL_BET = 2;

interface Props {
    ball: Phaser.Physics.Matter.Image,
    multiplier: Phaser.GameObjects.Image,
    scene: Phaser.Scene,
    objects: PlinkoGameObjectsType,
    sounds: PlinkoGameSoundsType
}

export default function plinkoHandleBallMultiplierHit({
                                                          ball,
                                                          multiplier,
                                                          scene,
                                                          sounds
                                                      }: Props) {
    if (ball.getData('hitMultiplier')) {
        return;
    }

    ball.setData('hitMultiplier', true);

    ball.setData('markedForDestroy', true);

    scene.tweens.add({
        targets: ball,
        alpha: 0,
        duration: 150,
        ease: 'Power2'
    });

    if (multiplier.getData('isAnimating')) {
        return;
    }

    const baseY = multiplier.getData('baseY') || multiplier.y;
    const bounceDistance = 10;

    // Mark as animating
    multiplier.setData('isAnimating', true);

    scene.tweens.add({
        targets: multiplier,
        y: baseY + bounceDistance,
        duration: 150,
        ease: 'Power2.easeOut',
        yoyo: true,
        onComplete: () => {
            multiplier.setY(baseY);
            multiplier.setData('isAnimating', false);
        }
    });

    const baseMultiplier: number = multiplier.getData('value');
    const ballFruit: BallImageType | undefined = ball.getData('fruit');
    const isBonus = !!ballFruit && ballFruit === multiplier.getData('fruit');
    const payout = isBonus
        ? Math.round(baseMultiplier * FRUIT_BONUS_MULTIPLIERS[ballFruit] * 100) / 100
        : baseMultiplier;

    gameEvents.emit(GameEventsEnum.BALL_DROPPED, {
        id: ball.getData('id'),
        time: dayjs().format('HH:mm:ss'),
        payout,
        baseMultiplier,
        bonusFruit: isBonus ? ballFruit : undefined,
        totalBet: TOTAL_BET,
        profit: payout * TOTAL_BET,
        createdAt: Date.now(),
    } as PlinkoHistoryItemType);

    if (sounds?.success && !sounds.success.mute) {
        scene.sound.play('success');
    }
}
