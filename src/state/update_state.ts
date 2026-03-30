import { BuilderType } from "../enums/builder_type";

export class UpdateState {
   builderType: BuilderType = BuilderType.None;
   columnName: string | undefined = undefined;
   value: any = undefined;
   raw: string | undefined = undefined;
}
