import type { ParserArea } from "../enums/parser_area";

/** Error thrown when SQL parsing fails; {@link ParserError.name} is `SqlEasyParserError`. */
export class ParserError extends Error {
   /**
    * @param parserArea - Phase or region of the parser where the error occurred.
    * @param message - Human-readable parse error description.
    */
   public constructor(parserArea: ParserArea, message: string) {
      const finalMessage = `${parserArea}: ${message}`;
      super(finalMessage);
      this.name = "SqlEasyParserError";
   }
}
