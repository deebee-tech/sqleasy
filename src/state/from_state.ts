import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

export class FromState {
   builderType: BuilderType = BuilderType.None;
   owner: string | undefined = undefined;
   tableName: string | undefined = undefined;
   alias: string | undefined = undefined;
   sqlEasyState: SqlEasyState | undefined = undefined;
   raw: string | undefined = undefined;
}
