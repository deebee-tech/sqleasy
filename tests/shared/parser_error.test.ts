import { describe, expect, it } from "vitest";
import { ParserError } from "../../src/helpers/parser_error";
import { ParserArea } from "../../src/enums/parser_area";

describe("ParserError", () => {
   it("creates error with correct name SqlEasyParserError", () => {
      const error = new ParserError(ParserArea.Select, "test message");
      expect(error.name).toBe("SqlEasyParserError");
   });

   it("message includes ParserArea string for Select", () => {
      const error = new ParserError(ParserArea.Select, "column is required");
      expect(error.message).toBe("Select: column is required");
   });

   it("message includes ParserArea string for From", () => {
      const error = new ParserError(ParserArea.From, "table is required");
      expect(error.message).toBe("From: table is required");
   });

   it("message includes ParserArea string for Join", () => {
      const error = new ParserError(ParserArea.Join, "missing join condition");
      expect(error.message).toBe("Join: missing join condition");
   });

   it("message includes ParserArea string for Where", () => {
      const error = new ParserError(ParserArea.Where, "invalid operator");
      expect(error.message).toBe("Where: invalid operator");
   });

   it("message includes ParserArea string for OrderBy", () => {
      const error = new ParserError(ParserArea.OrderBy, "direction required");
      expect(error.message).toBe("OrderBy: direction required");
   });

   it("message includes ParserArea string for LimitOffset", () => {
      const error = new ParserError(ParserArea.LimitOffset, "invalid limit");
      expect(error.message).toBe("LimitOffset: invalid limit");
   });

   it("message includes ParserArea string for General", () => {
      const error = new ParserError(ParserArea.General, "unknown error");
      expect(error.message).toBe("General: unknown error");
   });

   it("is an instance of Error", () => {
      const error = new ParserError(ParserArea.Select, "test");
      expect(error).toBeInstanceOf(Error);
   });

   it("is an instance of ParserError", () => {
      const error = new ParserError(ParserArea.Select, "test");
      expect(error).toBeInstanceOf(ParserError);
   });

   it("can be thrown and caught", () => {
      expect(() => {
         throw new ParserError(ParserArea.Select, "something went wrong");
      }).toThrow("Select: something went wrong");
   });

   it("can be caught as Error", () => {
      expect(() => {
         throw new ParserError(ParserArea.General, "fail");
      }).toThrow(Error);
   });
});
