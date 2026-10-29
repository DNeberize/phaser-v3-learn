import plinkoCreatePegs from "./components/plinkoCreatePegs.ts";
import plinkoSetupCollissions from "./components/plinkoSetupCollissions.ts";
import {plinkoCreateMultipliers} from "./components/plinkoCreateMultipliers.ts";
import plinkoSyncCameraZoom from "./components/plinkoSyncCameraZoom.ts";
import {gameEvents} from "../../../../../utils/gameEvents.ts";
import plinkoDropBall, {getRandomBallImage} from "./components/plinkoDropBall.ts";
import plinkoGenerateRandomBallPath from "./components/plinkoGenerateRandomBallPath.ts";
import {plinkoCreateWheel} from "./components/plinkoCreateWheel.ts";
import {GameEventsEnum} from "../../../../../utils/enums/gameEvents.enum.ts";
import {plinkoToggleSound} from "./components/plinkoToggleSound.ts";
import {plinkoToggleMusic} from "./components/plinkoToggleMusic.ts";
import {type AudioSettings, useAudioStore} from "../../../../../store/audioStore.ts";

export type PlinkoGameObjectsType = {
    pegs: Phaser.Physics.Matter.Image[],
    balls: Phaser.Physics.Matter.Image[],
    cageBalls: Phaser.Physics.Matter.Image[],
    wheel: Phaser.GameObjects.Video | null,
    multipliers: Phaser.GameObjects.Image[],
    dropButton: Phaser.GameObjects.Rectangle | null,
    dropButtonText: Phaser.GameObjects.Text | null,
    gameContainer: Phaser.GameObjects.Container | null
}

export type PlinkoGameSoundsType = {
    success: Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | null,
    background: Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | null
}

// game dimensions
export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 1000;
export const WHEEL_CENTER_X = VIRTUAL_WIDTH / 2;
export const WHEEL_CENTER_Y = -5;


export class PlinkoGameScene extends Phaser.Scene {

    constructor() {
        super({key: 'PlinkoGameScene'});
    }

    objects: PlinkoGameObjectsType = {
        pegs: [],
        balls: [],
        cageBalls: [],
        wheel: null,
        multipliers: [],
        dropButton: null,
        dropButtonText: null,
        gameContainer: null
    }
    device: 'desktop' | 'mobile' = 'desktop';
    sounds: PlinkoGameSoundsType = {
        success: null,
        background: null,
    };


    handleResize() {
        plinkoSyncCameraZoom({
            scene: this
        });

        const canvas = document.getElementById('game');

        if (canvas) {
            if (canvas.clientWidth < 1024 && this.device === 'desktop') {
                this.device = 'mobile';
            } else if (canvas.clientWidth > 1023 && this.device === 'mobile') {
                this.device = 'desktop';
            }
        }
    }

    preload() {
    }

    handleDropBall = () => {
        plinkoDropBall({
            this: this,
            objects: this.objects,
            ballPath: plinkoGenerateRandomBallPath(14),
            ballImage: getRandomBallImage()
        });
    }

    unsubscribeAudioSettings: (() => void) | null = null;

    applyAudioSettings = ({soundEnabled, musicEnabled}: AudioSettings) => {
        plinkoToggleSound({
            enabled: soundEnabled,
            sounds: this.sounds
        });
        plinkoToggleMusic({
            enabled: musicEnabled,
            sounds: this.sounds
        });
    }

    handleChangeRows = ({rows}: { rows: number }) => {
        plinkoCreatePegs({
            objects: this.objects, this: this, rows
        });
        plinkoCreateMultipliers({objects: this.objects, this: this, rows});
    }

    create() {
        this.sounds = {
            success: this.sound.add('success', { loop: false }),
            background: this.sound.add('background', { loop: true }),
        };

        // Apply saved sound/music settings before anything plays, then follow changes from the UI
        this.applyAudioSettings(useAudioStore.getState());
        this.unsubscribeAudioSettings = useAudioStore.subscribe(this.applyAudioSettings);

        const canvas = document.getElementById('game');

        if (canvas) {
            this.device = canvas.clientWidth > 1023 ? 'mobile' : 'desktop';
        }

        this.matter.world.setBounds(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        (this.matter.world.engine as unknown as { gravity: { y: number } }).gravity.y = 1.5;

        plinkoCreateWheel({objects: this.objects, this: this})

        plinkoCreatePegs({objects: this.objects, this: this, rows: 14});

        plinkoCreateMultipliers({objects: this.objects, this: this, rows: 14});

        plinkoSetupCollissions({
            this: this,
            objects: this.objects,
            sounds: this.sounds
        });

        gameEvents.on(GameEventsEnum.DROP_BALL, this.handleDropBall);
        gameEvents.on(GameEventsEnum.CHANGE_ROWS, this.handleChangeRows);

        this.handleResize();

        this.scale.on('resize', this.handleResize, this);

        // Phaser never calls a scene's destroy() itself, so clean up on shutdown
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

        gameEvents.emit(GameEventsEnum.GAME_LOADED);

        setTimeout(() => {
            this.handleResize()
        }, 100)

        if (this.sounds?.background) {
            this.sounds.background.play({loop: true});
        }
    }

    update() {
        if (this.objects.wheel) {
            this.objects.wheel.rotation += 0.02;
        }

        // Remove faded-out balls in place to avoid allocating a new array every frame
        const balls = this.objects.balls;
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            if (ball.getData('markedForDestroy') && ball.alpha <= 0) {
                this.tweens.killTweensOf(ball);
                ball.destroy();
                balls.splice(i, 1);
            }
        }
    }

    handleShutdown() {
        this.scale.off('resize', this.handleResize, this);

        gameEvents.off(GameEventsEnum.DROP_BALL, this.handleDropBall);
        gameEvents.off(GameEventsEnum.CHANGE_ROWS, this.handleChangeRows);

        this.unsubscribeAudioSettings?.();
        this.unsubscribeAudioSettings = null;
    }
}
