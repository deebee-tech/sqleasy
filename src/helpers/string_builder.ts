export default class StringBuilder {
   private _parts: string[] = [];

   public append(value: string): StringBuilder {
      this._parts.push(value);
      return this;
   }

   public toString(): string {
      return this._parts.join("");
   }
}
