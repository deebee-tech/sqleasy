import type { IBuilder } from "../builder/interface_builder";
import type { IJoinOnBuilder } from "../builder/interface_join_on_builder";
import type { IMultiBuilder } from "../builder/interface_multi_builder";
import type { IConfiguration } from "../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../configuration/runtime_configuration";
import type { IParser } from "../parser/interface_parser";

export interface ISqlEasy<
   T extends IBuilder<T, U, W>,
   U extends IJoinOnBuilder<U>,
   V extends IMultiBuilder<T, U, W>,
   W extends IParser,
> {
   configuration(): IConfiguration;
   newBuilder(rc?: RuntimeConfiguration): T;
   newMultiBuilder(rc?: RuntimeConfiguration): V;
}
