import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

export class CteState {
   builderType: BuilderType = BuilderType.None;
   name: string = "";
   recursive: boolean = false;
   sqlEasyState: SqlEasyState | undefined = undefined;
   raw: string | undefined = undefined;
}
