import type { State } from "./state"

export interface optionsInterface {
  value: any;
  onChange?: Function;
  args?: Array<State>;
  compute?: Function;
  deps?: Array<State>;
}

export interface subInterface {
  type: "normal" | "dependent";
  update: Function;
  args: Array<State>
}

export interface smInterface {
  (state: string): State | undefined;
  states: Record<string, State>
  new: Function;
  del: Function;
}