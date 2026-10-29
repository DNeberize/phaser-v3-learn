import type {PlinkoGameSoundsType} from "../PlinkoGameScene.ts";

interface Props {
  enabled: boolean;
  sounds: PlinkoGameSoundsType;
}

export function plinkoToggleMusic({enabled, sounds}: Props) {
  if (sounds?.background) {
    sounds.background.setMute(!enabled)
  }
}
