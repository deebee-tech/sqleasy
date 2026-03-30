import { BuilderType } from "../enums/builder_type";

export class GroupByState {
   builderType: BuilderType = BuilderType.None;
   tableNameOrAlias: string | undefined = undefined;
   columnName: string | undefined = undefined;
   raw: string | undefined = undefined;
}
