import type {PlinkoGameSoundsType} from "../PlinkoGameScene.ts";

interface Props {
  enabled: boolean;
  sounds: PlinkoGameSoundsType;
}

export function plinkoToggleSound({enabled, sounds}: Props) {
  if (sounds?.success) {
    sounds.success.setMute(!enabled)
  }
}
