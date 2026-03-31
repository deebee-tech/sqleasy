import type { IBuilder } from "../builder/interface_builder";
import type { IJoinOnBuilder } from "../builder/interface_join_on_builder";
import type { IMultiBuilder } from "../builder/interface_multi_builder";
import type { IConfiguration } from "../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../configuration/runtime_configuration";
import type { IParser } from "../parser/interface_parser";

/**
 * Top-level entry point for a specific SQL dialect.
 *
 * Each supported database has a concrete implementation (e.g. {@link PostgresSqlEasy},
 * {@link MssqlSqlEasy}) that provides dialect-aware builders and configuration.
 *
 * @template T The concrete builder type
 * @template U The concrete join-on builder type
 * @template V The concrete multi-builder type
 * @template W The concrete parser type
 */
export interface ISqlEasy<
   T extends IBuilder<T, U, W>,
   U extends IJoinOnBuilder<U>,
   V extends IMultiBuilder<T, U, W>,
   W extends IParser,
> {
   /** Returns the dialect-specific configuration for this instance. */
   configuration(): IConfiguration;

   /**
    * Creates a new single-query builder for constructing SQL statements.
    *
    * @param rc Optional runtime configuration override
    */
   newBuilder(rc?: RuntimeConfiguration): T;

   /**
    * Creates a new multi-statement builder for batching multiple queries.
    *
    * @param rc Optional runtime configuration override
    */
   newMultiBuilder(rc?: RuntimeConfiguration): V;
}
