import type {PlinkoGameObjectsType} from "../PlinkoGameScene.ts";
import {VIRTUAL_WIDTH} from "../PlinkoGameScene.ts";

interface Props {
    objects: PlinkoGameObjectsType;
    this: Phaser.Scene & {
        matter: Phaser.Physics.Matter.MatterPhysics;
    };
    rows: number;
}

const MIN_START_Y = 160;
const MAX_START_Y = 120;

const MIN_ROWS = 7;
const MAX_ROWS = 14;

// Values at MAX_ROWS (14)
const MAX_HORIZONTAL_GAP = 48;
const MAX_VERTICAL_GAP = 44;
const MAX_PEG_DIAMETER = 16;

// Values at MIN_ROWS (7)
const MIN_HORIZONTAL_GAP = 72;
const MIN_VERTICAL_GAP = 66;
const MIN_PEG_DIAMETER = 24;

// Peg hit glow tuning
export const PEG_GLOW = {
    // Peak brightness of the flash, 0 (off) to 1 (full)
    intensity: 0.5,
    // Glow diameter relative to peg diameter
    size: 2.5,
    // Glow scale at the moment of the hit, grows to 1 while fading
    startScale: 0.7,
    // Fade-out time in ms
    duration: 450,
};

const PEG_GLOW_TEXTURE = 'pegGlow';
const PEG_GLOW_TEXTURE_SIZE = 128;

function lerp(min: number, max: number, t: number): number {
    return min + (max - min) * t;
}

// Radial gradient texture shared by all peg glows, generated once
function ensurePegGlowTexture(scene: Phaser.Scene) {
    if (scene.textures.exists(PEG_GLOW_TEXTURE)) {
        return;
    }

    const texture = scene.textures.createCanvas(PEG_GLOW_TEXTURE, PEG_GLOW_TEXTURE_SIZE, PEG_GLOW_TEXTURE_SIZE);
    if (!texture) {
        return;
    }

    const ctx = texture.getContext();
    const center = PEG_GLOW_TEXTURE_SIZE / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 245, 255, 1)');
    gradient.addColorStop(0.18, 'rgba(240, 220, 255, 0.95)');
    gradient.addColorStop(0.4, 'rgba(192, 132, 252, 0.6)');
    gradient.addColorStop(0.7, 'rgba(162, 51, 234, 0.25)');
    gradient.addColorStop(1, 'rgba(162, 51, 234, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PEG_GLOW_TEXTURE_SIZE, PEG_GLOW_TEXTURE_SIZE);
    texture.refresh();
}

export default function plinkoCreatePegs({ objects, this: scene, rows }: Props): void {
    // Destroy existing pegs before recreating
    if (objects.pegs && objects.pegs.length > 0) {
        objects.pegs.forEach(peg => {
            const glow = peg.getData('glow') as Phaser.GameObjects.Image | undefined;
            if (glow) {
                scene.tweens.killTweensOf(glow);
                glow.destroy();
            }
            scene.matter.world.remove(peg.body as MatterJS.BodyType);
            peg.destroy();
        });
        objects.pegs = [];
    }

    ensurePegGlowTexture(scene);

    // t=0 at MIN_ROWS, t=1 at MAX_ROWS
    const t = (rows - MIN_ROWS) / (MAX_ROWS - MIN_ROWS);

    const startY = lerp(MIN_START_Y, MAX_START_Y, t);
    const horizontalGap = lerp(MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP, t);
    const verticalGap = lerp(MIN_VERTICAL_GAP, MAX_VERTICAL_GAP, t);
    const pegDiameter = lerp(MIN_PEG_DIAMETER, MAX_PEG_DIAMETER, t);
    const pegRadius = pegDiameter / 2;

    const centerX = VIRTUAL_WIDTH / 2;

    for (let row = 0; row < rows; row++) {
        const pegsInRow = row + 3;
        const startX = centerX - (pegsInRow - 1) * horizontalGap / 2;

        for (let col = 0; col < pegsInRow; col++) {
            const x = startX + col * horizontalGap;
            const y = startY + row * verticalGap;

            const peg = scene.matter.add.image(x, y, 'pegImage', undefined, {
                isStatic: true,
                shape: { type: 'circle', radius: pegRadius },
                chamfer: { radius: 0 }
            });

            peg.setDisplaySize(pegDiameter, pegDiameter);

            peg.setBody({
                type: 'circle',
                radius: pegRadius
            }, {
                isStatic: true,
                label: 'peg',
                restitution: 0,
                friction: 0,
                collisionFilter: {
                    category: 0x0001,
                    mask: 0x0002
                }
            });

            // Reusable glow drawn above the peg with additive blending so it brightens it
            const glowSize = pegDiameter * PEG_GLOW.size;
            const glow = scene.add.image(x, y, PEG_GLOW_TEXTURE)
                .setDisplaySize(glowSize, glowSize)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(peg.depth + 1)
                .setAlpha(0)
                .setVisible(false);
            glow.setData('baseScale', glow.scale);

            peg.setData('rowIndex', row);
            peg.setData('colIndex', col);
            peg.setData('glow', glow);

            objects.pegs.push(peg);
        }
    }
}