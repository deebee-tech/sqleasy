import { BuilderType } from "../enums/builder_type";
import { WhereOperator } from "../enums/where_operator";
import type { SqlEasyState } from "./sqleasy_state";

export class WhereState {
   builderType: BuilderType = BuilderType.None;
   tableNameOrAlias: string | undefined = undefined;
   columnName: string | undefined = undefined;
   whereOperator: WhereOperator = WhereOperator.None;
   raw: string | undefined = undefined;
   sqlEasyState: SqlEasyState | undefined = undefined;
   values: any[] = [];
}
