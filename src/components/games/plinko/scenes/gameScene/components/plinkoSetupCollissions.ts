import type {PlinkoGameObjectsType, PlinkoGameSoundsType} from "../PlinkoGameScene.ts";
import plinkoHandleBallPegCollission from "./plinkoHandleBallPegCollission.ts";
import plinkoHandleBallMultiplierHit from "./plinkoHandleBallMultiplierHit.ts";

interface Props {
    this: Phaser.Scene & {
        matter: Phaser.Physics.Matter.MatterPhysics;
    };
    objects: PlinkoGameObjectsType;
    sounds: PlinkoGameSoundsType
}

type LabeledBody = MatterJS.BodyType & { label?: string; gameObject?: Phaser.GameObjects.GameObject };

// Bodies are tagged with a label ('ball', 'peg', 'multiplier') and Phaser links each body to its
// game object, so lookups are O(1) instead of scanning the balls/pegs arrays on every contact
function getGameObjectByLabel<T extends Phaser.GameObjects.GameObject>(
    bodyA: LabeledBody,
    bodyB: LabeledBody,
    label: string
): T | null {
    if (bodyA.label === label && bodyA.gameObject) {
        return bodyA.gameObject as T;
    }
    if (bodyB.label === label && bodyB.gameObject) {
        return bodyB.gameObject as T;
    }
    return null;
}

export default function plinkoSetupCollissions({this: scene, objects, sounds}: Props): void {
    scene.matter.world.on('collisionstart', (event: { pairs: { bodyA: MatterJS.BodyType; bodyB: MatterJS.BodyType }[] }) => {
        event.pairs.forEach((pair: { bodyA: MatterJS.BodyType; bodyB: MatterJS.BodyType }) => {
            const {bodyA, bodyB} = pair;

            const ball = getGameObjectByLabel<Phaser.Physics.Matter.Image>(bodyA, bodyB, 'ball');
            if (!ball) {
                return;
            }

            const peg = getGameObjectByLabel<Phaser.Physics.Matter.Image>(bodyA, bodyB, 'peg');
            if (peg) {
                plinkoHandleBallPegCollission(ball, peg, scene);
                return;
            }

            const multiplier = getGameObjectByLabel<Phaser.GameObjects.Image>(bodyA, bodyB, 'multiplier');
            if (multiplier) {
                plinkoHandleBallMultiplierHit({
                    ball,
                    multiplier,
                    scene,
                    objects,
                    sounds
                })
            }
        });
    });
}
