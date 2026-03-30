export class InsertState {
   owner: string | undefined = undefined;
   tableName: string | undefined = undefined;
   columns: string[] = [];
   values: any[][] = [];
   raw: string | undefined = undefined;
}
