import type { SharedResultKinds } from "../result-kinds";

export type Success<D> = {
  kind: (typeof SharedResultKinds)["Success"];
  data: D;
};

export type Failure<K extends string, E = undefined> = E extends undefined
  ? { kind: K }
  : { kind: K; error: E };
