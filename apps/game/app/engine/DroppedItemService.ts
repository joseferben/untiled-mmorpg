import type { ItemKindOpts, DroppedItem, DropTable } from "@wwyb/core";
import { EntityDB } from "@wwyb/entitydb";
import { pickRandomRange } from "~/engine/math";
import { Profiler } from "./Profiler";

export class DroppedItemService extends Profiler {
  db!: EntityDB<DroppedItem>;
  constructor(readonly itemKinds: { [name: string]: ItemKindOpts }) {
    super();
    this.db = new EntityDB<DroppedItem>({
      namespace: "dit",
      spatial: true,
    });
  }

  spawn(x: number, y: number, itemKind: ItemKindOpts, amount?: number) {
    const item = {
      kind: itemKind.name,
      x: x,
      y: y,
      amount: amount || 1,
    };
    this.db.create(item);
    return item;
  }

  /**
   * Evaluate a drop table and drop items at provided location.
   */
  drop(x: number, y: number, dropTable: DropTable) {
    for (const [kind, [from, to], p] of dropTable) {
      if (Math.random() < p) {
        const amount = pickRandomRange([from, to]);
        this.spawn(x, y, kind, amount);
      }
    }
  }

  kindByName(kindName: string) {
    const kind = this.itemKinds[kindName];
    if (!kind) {
      throw new Error(`item kind ${kindName} does not exist`);
    }
    return kind;
  }

  kind(item: DroppedItem) {
    return this.kindByName(item.kind);
  }

  delete(item: DroppedItem) {
    this.db.delete(item);
  }
}
