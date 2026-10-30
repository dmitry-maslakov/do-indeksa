import type { RefObject } from "react";

export interface InputStats {
  focusAt?: number;
  inputs: number;
  deletes: number;
  pastes: number;
  vk_inputs: number;
}

export const freshInput = (): InputStats => ({
  inputs: 0,
  deletes: 0,
  pastes: 0,
  vk_inputs: 0,
});

export function focused(input: InputStats) {
  input.focusAt ??= performance.now();
}

export function countInput(
  input: InputStats,
  { inputType, data, isComposing }: InputEvent,
) {
  if (isComposing || inputType === "insertCompositionText") return;
  const type = inputType || data || "";
  focused(input);
  input.inputs += 1;
  if (type.startsWith("delete")) input.deletes += 1;
  if (type === "insertFromPaste") input.pastes += 1;
  if (window.mathVirtualKeyboard?.visible) input.vk_inputs += 1;
}

export function takeInput(input: RefObject<InputStats>) {
  const taken = input.current;
  input.current = freshInput();
  return taken;
}
