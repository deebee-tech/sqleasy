import type { IConfiguration } from "../configuration/interface_configuration";
import type { JoinOperator } from "../enums/join_operator";
import type { JoinOnState } from "../state/join_on_state";

/**
 * Builder for defining JOIN ON conditions with support for AND/OR logic
 * and grouped conditions.
 *
 * Instances are provided via the `joinOnBuilder` callback parameter of
 * {@link IBuilder.joinTable} and related methods.
 *
 * @template T The concrete join-on builder type for fluent chaining
 */
export interface IJoinOnBuilder<T> {
   /** Inserts an explicit AND between ON conditions. */
   and(): T;

   /**
    * Creates a new join-on builder instance, optionally with a different configuration.
    *
    * @param config Optional configuration override
    */
   newJoinOnBuilder(config?: IConfiguration): T;

   /**
    * Adds an ON condition comparing columns from two tables.
    *
    * @param aliasLeft The alias of the left table
    * @param columnLeft The column name from the left table
    * @param joinOperator The comparison operator
    * @param aliasRight The alias of the right table
    * @param columnRight The column name from the right table
    */
   on(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string): T;

   /**
    * Groups ON conditions inside parentheses for precedence control.
    *
    * @param builder Callback that receives a join-on builder to define the grouped conditions
    */
   onGroup(builder: (jb: T) => void): T;

   /**
    * Adds an ON condition from a raw SQL string.
    *
    * @param raw The raw SQL fragment
    */
   onRaw(raw: string): T;

   /**
    * Adds an ON condition comparing a column to a literal value.
    *
    * @param aliasLeft The alias of the left table
    * @param columnLeft The column name from the left table
    * @param joinOperator The comparison operator
    * @param valueRight The literal value to compare against
    */
   onValue(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any): T;

   /** Inserts an explicit OR between ON conditions. */
   or(): T;

   /** Returns the accumulated array of {@link JoinOnState} entries. */
   states(): JoinOnState[];
}
