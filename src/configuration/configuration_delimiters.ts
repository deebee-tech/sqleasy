/** Pair of delimiter strings for quoting identifiers or framing transaction blocks. */
export class ConfigurationDelimiters {
   /** Opening delimiter (e.g. `[`, `` ` ``, or `"`). */
   begin: string = "";
   /** Closing delimiter matching {@link ConfigurationDelimiters.begin}. */
   end: string = "";
}
