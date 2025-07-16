import { BuilderType } from "../enums/builder_type";
import { JoinType } from "../enums/join_type";
import type { JoinOnState } from "./join_on_state";
import type { SqlEasyState } from "./sqleasy_state";

export class JoinState {
   builderType: BuilderType = BuilderType.None;
   joinType: JoinType = JoinType.Inner;
   owner: string | undefined = undefined;
   tableName: string | undefined = undefined;
   alias: string | undefined = undefined;
   sqlEasyState: SqlEasyState | undefined = undefined;
   raw: string | undefined = undefined;
   joinOnStates: JoinOnState[] = [];
}
