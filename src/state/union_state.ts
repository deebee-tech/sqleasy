import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

export class UnionState {
   builderType: BuilderType = BuilderType.None;
   sqlEasyState: SqlEasyState | undefined = undefined;
   raw: string | undefined = undefined;
}
