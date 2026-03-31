/** Options passed when creating SqlEasy instances or builders. */
export class RuntimeConfiguration {
   /** Maximum number of rows to return from queries; defaults to 1000. */
   maxRowsReturned: number = 1000;
   /** Optional host-defined settings carried alongside runtime options. */
   customConfiguration: any | undefined = undefined;
}
