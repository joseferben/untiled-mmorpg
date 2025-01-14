// create entitydb and store entity test

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { EntityDB } from "./EntityDB";
import { JSONStore } from "./JSONStore";

type Foo = {
  id: string;
  v: number;
  name: string;
  x: number;
  y: number;
  inCombat?: boolean;
  complex?: { foo: string };
};

let db: EntityDB<Foo>;

beforeEach(async () => {
  const s = new Database(":memory:");
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  const jsonDB = new JSONStore(s);
  db = new EntityDB<Foo>({
    jsonStore: jsonDB,
    namespace: "foo",
    fields: ["name", "x"],
    spatial: true,
  });
});

afterEach(() => {
  db.close();
});

describe("EntityDB", () => {
  it("create foo", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    const first = db.findById(created.id);
    expect(first).toHaveProperty("name", "first");
    expect(first).toHaveProperty("v", 0);
  });
  it("update foo", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    created.name = "updated";
    created.inCombat = true;
    db.update(created);
    const updated = db.findById(created.id);
    expect(updated).toHaveProperty("name", "updated");
  });
  it("find by position after delete", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.delete(created);
    const found = db.findByPosition(1, 3);
    expect(found).toHaveLength(0);
  });
  it("find by position after deleteById", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.deleteById(created.id);
    const found = db.findByPosition(1, 3);
    expect(found).toHaveLength(0);
  });
  it("find by rectangle after delete", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.delete(created);
    const found = db.findByRectangle(0, 0, 2, 4);
    expect(found).toHaveLength(0);
  });
  it("find by field", () => {
    db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.create({
      name: "second",
      x: 1,
      y: 3,
    });
    const foundByName = db.findBy("name", "first");
    expect(foundByName).toHaveLength(1);
    expect(foundByName[0]).toHaveProperty("name", "first");
    const foundByX = db.findBy("x", 1);
    expect(foundByX).toHaveLength(2);
  });
  it("find by 2 fields", () => {
    db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.create({
      name: "second",
      x: 1,
      y: 3,
    });
    const found = db.findByFilter({ name: "first", x: 1 });
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveProperty("name", "first");
  });
  it("find by rectangle", () => {
    db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.create({
      name: "second",
      x: 2,
      y: 3,
    });
    db.create({
      name: "third",
      x: 3,
      y: 3,
    });
    const found = db.findByRectangle(1, 3, 2, 3);
    expect(found).toHaveLength(2);
  });
  it("migrate", () => {
    const s = new Database(":memory:");
    s.pragma("journal_mode = WAL");
    s.pragma("synchronous = off");
    const jsonDB = new JSONStore(s);
    jsonDB.set("123", { id: "123", foo: "bar" }, "fob");

    const migrations = {
      0: (json: { foo: string }) => ({
        fooz: json.foo,
      }),
      1: (json: { fooz: string }) => ({
        fooz: json.fooz,
        hello: "world",
        foor: json.fooz,
      }),
    };
    const testDb = new EntityDB<Foo>({
      migrations,
      jsonStore: jsonDB,
      namespace: "fob",
    });

    const migrated = testDb.findById("123");

    expect(migrated).toHaveProperty("fooz", "bar");
    expect(migrated).toHaveProperty("hello", "world");
    expect(migrated).toHaveProperty("foor", "bar");
    expect(migrated).not.toHaveProperty("foo");
    expect(migrated).toHaveProperty("v", 2);
  });
});
