import { describe, expect, it } from "vitest";
import { MssqlSqlEasy } from "../../src";
import { WhereOperator } from "../../src/enums/where_operator";
import { OrderByDirection } from "../../src/enums/order_by_direction";

describe("Builder state management", () => {
   const sqlEasy = new MssqlSqlEasy();

   describe("clearAll", () => {
      it("resets all state to defaults", () => {
         const builder = sqlEasy.newBuilder();
         builder
            .selectColumn("u", "id", "id")
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .limit(10)
            .offset(5);

         builder.clearAll();
         const state = builder.state();

         expect(state.selectStates).toEqual([]);
         expect(state.fromStates).toEqual([]);
         expect(state.whereStates).toEqual([]);
         expect(state.joinStates).toEqual([]);
         expect(state.orderByStates).toEqual([]);
         expect(state.groupByStates).toEqual([]);
         expect(state.havingStates).toEqual([]);
         expect(state.limit).toBe(0);
         expect(state.offset).toBe(0);
      });
   });

   describe("clearSelect", () => {
      it("clears only select states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectColumn("u", "id", "id").fromTable("users", "u");
         builder.clearSelect();

         expect(builder.state().selectStates).toEqual([]);
         expect(builder.state().fromStates.length).toBe(1);
      });
   });

   describe("clearFrom", () => {
      it("clears only from states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectColumn("u", "id", "id").fromTable("users", "u");
         builder.clearFrom();

         expect(builder.state().fromStates).toEqual([]);
         expect(builder.state().selectStates.length).toBe(1);
      });
   });

   describe("clearJoin", () => {
      it("clears only join states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").joinRaw("INNER JOIN orders AS o ON u.id = o.user_id");
         builder.clearJoin();

         expect(builder.state().joinStates).toEqual([]);
         expect(builder.state().fromStates.length).toBe(1);
      });
   });

   describe("clearWhere", () => {
      it("clears only where states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
         builder.clearWhere();

         expect(builder.state().whereStates).toEqual([]);
         expect(builder.state().fromStates.length).toBe(1);
      });
   });

   describe("clearOrderBy", () => {
      it("clears only orderBy states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").orderByColumn("u", "name", OrderByDirection.Ascending);
         builder.clearOrderBy();

         expect(builder.state().orderByStates).toEqual([]);
         expect(builder.state().fromStates.length).toBe(1);
      });
   });

   describe("clearLimit", () => {
      it("resets limit to 0", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").limit(50);
         expect(builder.state().limit).toBe(50);

         builder.clearLimit();
         expect(builder.state().limit).toBe(0);
      });
   });

   describe("clearOffset", () => {
      it("resets offset to 0", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").offset(20);
         expect(builder.state().offset).toBe(20);

         builder.clearOffset();
         expect(builder.state().offset).toBe(0);
      });
   });

   describe("clearGroupBy", () => {
      it("clears only groupBy states", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").groupByColumn("u", "status");
         builder.clearGroupBy();

         expect(builder.state().groupByStates).toEqual([]);
         expect(builder.state().fromStates.length).toBe(1);
      });
   });

   describe("clearHaving", () => {
      it("clears only having states", () => {
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .groupByColumn("u", "status")
            .having("u", "status", WhereOperator.Equals, "active");
         builder.clearHaving();

         expect(builder.state().havingStates).toEqual([]);
         expect(builder.state().groupByStates.length).toBe(1);
      });
   });

   describe("state()", () => {
      it("returns the SqlEasyState object", () => {
         const builder = sqlEasy.newBuilder();
         const state = builder.state();

         expect(state).toBeDefined();
         expect(state.selectStates).toBeDefined();
         expect(state.fromStates).toBeDefined();
         expect(state.whereStates).toBeDefined();
         expect(state.joinStates).toBeDefined();
         expect(state.orderByStates).toBeDefined();
         expect(state.groupByStates).toBeDefined();
         expect(state.havingStates).toBeDefined();
         expect(state.limit).toBe(0);
         expect(state.offset).toBe(0);
         expect(state.distinct).toBe(false);
      });

      it("reflects mutations made through the builder", () => {
         const builder = sqlEasy.newBuilder();
         builder.selectColumn("u", "id", "user_id").fromTable("users", "u");

         const state = builder.state();
         expect(state.selectStates.length).toBe(1);
         expect(state.fromStates.length).toBe(1);
      });
   });

   describe("chaining", () => {
      it("returns the builder for fluent API", () => {
         const builder = sqlEasy.newBuilder();
         const result = builder
            .selectColumn("u", "id", "id")
            .selectColumn("u", "name", "name")
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.GreaterThan, 0)
            .orderByColumn("u", "name", OrderByDirection.Ascending)
            .limit(10)
            .offset(5);

         expect(result).toBe(builder);
      });

      it("clear methods return the builder for continued chaining", () => {
         const builder = sqlEasy.newBuilder();
         const result = builder.selectAll().fromTable("users", "u").clearSelect().selectColumn("u", "id", "id");

         expect(result).toBe(builder);
         expect(builder.state().selectStates.length).toBe(1);
      });

      it("clearAll returns the builder for continued chaining", () => {
         const builder = sqlEasy.newBuilder();
         const result = builder.selectAll().fromTable("users", "u").clearAll().selectColumn("u", "name", "name");

         expect(result).toBe(builder);
         expect(builder.state().selectStates.length).toBe(1);
         expect(builder.state().fromStates.length).toBe(0);
      });
   });
});
