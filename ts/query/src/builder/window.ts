import { FrameBoundType } from '../enums/frame-bound-type';
import { FrameUnit } from '../enums/frame-unit';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';
import { createWindowState, type WindowState } from '../state/window';

/**
 * Fluent builder for a window function's `OVER (...)` clause — `PARTITION BY`, `ORDER BY`
 * (with `NULLS FIRST`/`NULLS LAST`), and an optional `ROWS`/`RANGE` frame. One class for every
 * dialect; {@link state} hands the accumulated clause to {@link QueryBuilder.selectWindow}.
 */
export class WindowBuilder {
  #state: WindowState = createWindowState();

  public partitionByColumn = (tableNameOrAlias: string, columnName: string): this => {
    this.#state.partitionByStates.push({ tableNameOrAlias, columnName, raw: undefined });
    return this;
  };

  public partitionByColumns = (
    columns: { tableNameOrAlias: string; columnName: string }[],
  ): this => {
    columns.forEach((column) => {
      this.partitionByColumn(column.tableNameOrAlias, column.columnName);
    });
    return this;
  };

  public partitionByRaw = (raw: string): this => {
    this.#state.partitionByStates.push({
      tableNameOrAlias: undefined,
      columnName: undefined,
      raw,
    });
    return this;
  };

  public orderByColumn = (
    tableNameOrAlias: string,
    columnName: string,
    direction: OrderByDirection = OrderByDirection.None,
    nulls: NullsOrder = NullsOrder.None,
  ): this => {
    this.#state.orderByStates.push({
      tableNameOrAlias,
      columnName,
      direction,
      nulls,
      raw: undefined,
    });
    return this;
  };

  public orderByRaw = (raw: string): this => {
    this.#state.orderByStates.push({
      tableNameOrAlias: undefined,
      columnName: undefined,
      direction: OrderByDirection.None,
      nulls: NullsOrder.None,
      raw,
    });
    return this;
  };

  /** Sets a structured `ROWS`/`RANGE BETWEEN start AND end` frame. Omit `end` for the SQL-standard single-bound shorthand (implicitly `AND CURRENT ROW`). */
  public frame = (
    unit: FrameUnit,
    startType: FrameBoundType,
    startOffset?: number,
    endType?: FrameBoundType,
    endOffset?: number,
  ): this => {
    this.#state.frame = {
      unit,
      start: { type: startType, offset: startOffset },
      end: endType ? { type: endType, offset: endOffset } : undefined,
      raw: undefined,
    };
    return this;
  };

  /** Raw-SQL form of {@link frame} for expressions the structured bounds can't express. */
  public frameRaw = (raw: string): this => {
    this.#state.frame = {
      unit: FrameUnit.Rows,
      start: { type: FrameBoundType.CurrentRow, offset: undefined },
      end: undefined,
      raw,
    };
    return this;
  };

  public state = (): WindowState => {
    return this.#state;
  };
}
