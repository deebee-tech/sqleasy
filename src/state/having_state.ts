import { BuilderType } from "../enums/builder_type";
import { WhereOperator } from "../enums/where_operator";

export class HavingState {
   builderType: BuilderType = BuilderType.None;
   tableNameOrAlias: string | undefined = undefined;
   columnName: string | undefined = undefined;
   whereOperator: WhereOperator = WhereOperator.None;
   raw: string | undefined = undefined;
   values: any[] = [];
}
