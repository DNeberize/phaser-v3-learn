import {PEG_GLOW} from "./plinkoCreatePegs.ts";

export default function plinkoHandleBallPegCollission(
    ball: Phaser.Physics.Matter.Image, 
    peg: Phaser.Physics.Matter.Image,
    scene: Phaser.Scene
) {
    const pegId = (peg.body as MatterJS.BodyType).id;
    const hitPegs = ball.getData('hitPegs') || new Set();

    if (hitPegs.has(pegId)) {
        return;
    }

    hitPegs.add(pegId);
    ball.setData('hitPegs', hitPegs);

    const glow = peg.getData('glow') as Phaser.GameObjects.Image | undefined;
    if (glow) {
        const baseScale = glow.getData('baseScale') as number;

        // Restart the flash if the peg is hit again while still glowing
        scene.tweens.killTweensOf(glow);
        glow.setVisible(true).setAlpha(PEG_GLOW.intensity).setScale(baseScale * PEG_GLOW.startScale);

        scene.tweens.add({
            targets: glow,
            alpha: 0,
            scale: baseScale,
            duration: PEG_GLOW.duration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                glow.setVisible(false);
            }
        });
    }

    const path = ball.getData('path') as number[];
    const pegRowIndex = peg.getData('rowIndex') as number;

    if (pegRowIndex >= path.length || pegRowIndex < 0) {
        return;
    }

    const direction = path[pegRowIndex] === 0 ? -1 : 1;
    
    const horizontalSpeed = 2.5;
    const minDownwardSpeed = 2.5;

    scene.time.delayedCall(1, () => {
        if (ball.body) {
            const body = ball.body as MatterJS.BodyType;
            const newVelocityY = Math.max(body.velocity.y, minDownwardSpeed);
            ball.setVelocity(direction * horizontalSpeed, newVelocityY);
        }
    });

}