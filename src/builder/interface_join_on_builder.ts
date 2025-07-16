import type { IConfiguration } from "../configuration/interface_configuration";
import type { JoinOperator } from "../enums/join_operator";
import type { JoinOnState } from "../state/join_on_state";

export interface IJoinOnBuilder<T> {
   and(): T;
   newJoinOnBuilder(config: IConfiguration): T;
   on(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string): T;
   onGroup(builder: (jb: T) => void): T;
   onRaw(raw: string): T;
   onValue(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any): T;
   or(): T;
   states(): JoinOnState[];
}
