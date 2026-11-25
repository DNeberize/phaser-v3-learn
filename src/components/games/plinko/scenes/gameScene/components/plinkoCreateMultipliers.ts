import type {PlinkoGameObjectsType} from "../PlinkoGameScene.ts";
import {VIRTUAL_WIDTH} from "../PlinkoGameScene.ts";
import type {BallImageType} from "./plinkoDropBall.ts";

// Matches the frames in plinkoMultipliers.png, left to right
export const MULTIPLIER_FRAMES: { value: number; fruit: BallImageType }[] = [
    {value: 18, fruit: 'star'},
    {value: 3.2, fruit: 'grape'},
    {value: 1.6, fruit: 'melon'},
    {value: 1.3, fruit: 'banana'},
    {value: 1.2, fruit: 'plum'},
    {value: 1.1, fruit: 'lemon'},
    {value: 1, fruit: 'orange'},
    {value: 0.5, fruit: 'cherry'},
    {value: 1, fruit: 'orange'},
    {value: 1.1, fruit: 'lemon'},
    {value: 1.2, fruit: 'plum'},
    {value: 1.3, fruit: 'banana'},
    {value: 1.6, fruit: 'melon'},
    {value: 3.2, fruit: 'grape'},
    {value: 18, fruit: 'star'},
];

interface Props {
    this: Phaser.Scene & {
        matter: Phaser.Physics.Matter.MatterPhysics;
    };
    objects: PlinkoGameObjectsType;
    rows: number;
}

const MIN_ROWS = 7;
const MAX_ROWS = 14;

const MAX_MULTIPLIER_WIDTH = 49;
const MAX_MULTIPLIER_HEIGHT = 36;

const MIN_MULTIPLIER_WIDTH = 73;
const MIN_MULTIPLIER_HEIGHT = 54;

const START_Y = 120;
const MAX_VERTICAL_GAP = 44;
const MIN_VERTICAL_GAP = 66;

function lerp(min: number, max: number, t: number): number {
    return min + (max - min) * t;
}

export function plinkoCreateMultipliers({ this: scene, objects, rows }: Props): void {
    // Destroy existing multipliers before recreating
    if (objects.multipliers && objects.multipliers.length > 0) {
        objects.multipliers.forEach(multiplier => {
            const sensor = multiplier.getData('sensor') as MatterJS.BodyType;
            if (sensor) {
                scene.matter.world.remove(sensor);
            }
            multiplier.destroy();
        });
        objects.multipliers = [];
    }

    const t = (rows - MIN_ROWS) / (MAX_ROWS - MIN_ROWS);

    const multiplierWidth = lerp(MIN_MULTIPLIER_WIDTH, MAX_MULTIPLIER_WIDTH, t);
    const multiplierHeight = lerp(MIN_MULTIPLIER_HEIGHT, MAX_MULTIPLIER_HEIGHT, t);
    const verticalGap = lerp(MIN_VERTICAL_GAP, MAX_VERTICAL_GAP, t);

    const numberOfMultipliers = rows + 1;

    const centerX = VIRTUAL_WIDTH / 2;
    const startX = centerX - (numberOfMultipliers - 1) * multiplierWidth / 2;
    const yPosition = START_Y + (rows - 1) * verticalGap + verticalGap + multiplierHeight / 2;

    for (let i = 0; i < numberOfMultipliers; i++) {
        const x = startX + i * multiplierWidth;

        const multiplier = scene.add.image(x, yPosition, 'multiplierSheet', i);

        multiplier.setDisplaySize(multiplierWidth, multiplierHeight);
        multiplier.setData('originalScale', multiplier.scale);
        multiplier.setData('baseY', yPosition);

        const sensor = scene.matter.add.rectangle(x, yPosition, multiplierWidth, multiplierHeight, {
            isStatic: true,
            isSensor: true,
            label: 'multiplier'
        });
        sensor.gameObject = multiplier;
        multiplier.setData('sensor', sensor);
        multiplier.setData('value', MULTIPLIER_FRAMES[i]?.value ?? 0);
        multiplier.setData('fruit', MULTIPLIER_FRAMES[i]?.fruit);

        objects.multipliers.push(multiplier);
    }
}