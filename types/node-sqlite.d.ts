declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export class StatementSync {
    run(
      ...params: Array<string | number | null | bigint>
    ): { changes: number; lastInsertRowid: number | bigint };
    get(...params: Array<string | number | null | bigint>): unknown;
    all(...params: Array<string | number | null | bigint>): unknown[];
  }
}
