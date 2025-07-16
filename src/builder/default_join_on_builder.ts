import type { IConfiguration } from "../configuration/interface_configuration";
import { JoinOnOperator } from "../enums/join_on_operator";
import { JoinOperator } from "../enums/join_operator";
import type { JoinOnState } from "../state/join_on_state";
import type { IJoinOnBuilder } from "./interface_join_on_builder";

export abstract class DefaultJoinOnBuilder<T extends IJoinOnBuilder<T>> implements IJoinOnBuilder<T> {
   private _states: JoinOnState[] = [];
   private _config: IConfiguration;

   constructor(config: IConfiguration) {
      this._config = config;
   }

   public abstract newJoinOnBuilder(): T;

   public and = (): T => {
      this._states.push({
         joinOperator: JoinOperator.None,
         joinOnOperator: JoinOnOperator.And,
         aliasLeft: undefined,
         columnLeft: undefined,
         aliasRight: undefined,
         columnRight: undefined,
         raw: undefined,
         valueRight: undefined,
      });

      return this as unknown as T;
   };

   public on = (
      aliasLeft: string,
      columnLeft: string,
      joinOperator: JoinOperator,
      aliasRight: string,
      columnRight: string,
   ): T => {
      this._states.push({
         joinOperator,
         joinOnOperator: JoinOnOperator.On,
         aliasLeft,
         columnLeft,
         aliasRight,
         columnRight,
         raw: undefined,
         valueRight: undefined,
      });

      return this as unknown as T;
   };

   public onGroup = (builder: (builder: T) => void): T => {
      this._states.push({
         joinOperator: JoinOperator.None,
         joinOnOperator: JoinOnOperator.GroupBegin,
         aliasLeft: undefined,
         columnLeft: undefined,
         aliasRight: undefined,
         columnRight: undefined,
         raw: undefined,
         valueRight: undefined,
      });

      const newBuilder = this.newJoinOnBuilder();
      builder(newBuilder);

      this._states.push({
         joinOperator: JoinOperator.None,
         joinOnOperator: JoinOnOperator.GroupEnd,
         aliasLeft: undefined,
         columnLeft: undefined,
         aliasRight: undefined,
         columnRight: undefined,
         raw: undefined,
         valueRight: undefined,
      });

      return this as unknown as T;
   };

   public onRaw = (raw: string): T => {
      this._states.push({
         joinOperator: JoinOperator.None,
         joinOnOperator: JoinOnOperator.Raw,
         aliasLeft: undefined,
         columnLeft: undefined,
         aliasRight: undefined,
         columnRight: undefined,
         raw,
         valueRight: undefined,
      });
      return this as unknown as T;
   };

   public onValue = (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any): T => {
      this._states.push({
         joinOperator,
         joinOnOperator: JoinOnOperator.Value,
         aliasLeft,
         columnLeft,
         aliasRight: undefined,
         columnRight: undefined,
         raw: undefined,
         valueRight,
      });
      return this as unknown as T;
   };

   public or = (): T => {
      this._states.push({
         joinOperator: JoinOperator.None,
         joinOnOperator: JoinOnOperator.Or,
         aliasLeft: undefined,
         columnLeft: undefined,
         aliasRight: undefined,
         columnRight: undefined,
         raw: undefined,
         valueRight: undefined,
      });

      return this as unknown as T;
   };

   public states = (): JoinOnState[] => {
      return this._states;
   };
}
