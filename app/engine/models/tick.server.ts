import { Observable } from "observable-fns";
import { Entity, Schema } from "redis-om";
import invariant from "tiny-invariant";
import { db } from "~/engine/db.server";
import { publisher, subscriber } from "../pubsub.server";

export interface Tickable {
  lastTickAt: Date | null;
  canTick(): boolean;
}

export interface Tick {
  entityId: string;
  actorId: string;
  targetId: string;
  name: string;
  tickAt: number;
}

const DEFAULT_EXPIRATION_MS = 10 * 1000;
const PUBSUB_CHANNEL_NAME = "tick";

export class Tick extends Entity {}

const tickSchema = new Schema(
  Tick,
  {
    actorId: { type: "string", indexed: true },
    targetId: { type: "string", indexed: true },
    name: { type: "string", indexed: true },
    tickAt: { type: "number", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export const tickRepository = db.fetchRepository(tickSchema);

async function getTicks() {
  return tickRepository.search().all();
}

export async function getTick(id: string) {
  const tick = await tickRepository.fetch(id);
  return tick.entityId === null ? null : tick;
}

export async function getTickByActor(id: string) {
  return tickRepository.search().where("actorId").equals(id).first();
}

export async function getTickOrThrow(id: string) {
  const tick = await getTick(id);
  if (tick === null) {
    throw new Error(`tick with id ${id} does not exist`);
  } else {
    return tick;
  }
}

export async function deleteTick(tick: Tick) {
  tickRepository.remove(tick.entityId);
}

async function scheduleTick(tick: Tick) {
  const ttlMs = Date.now() - tick.tickAt;
  setTimeout(
    () => publisher.publish(PUBSUB_CHANNEL_NAME, tick.entityId),
    ttlMs
  );
}

export async function createTick(
  actorId: string,
  targetId: string,
  name: string,
  tickAt?: number
) {
  invariant(actorId, "actorId can not be null");
  invariant(targetId, "targetId can not be null");
  invariant(name, "name can not be null");
  const now = Date.now();
  const tick = await tickRepository.createAndSave({
    targetId: targetId,
    actorId: actorId,
    name: name,
    tickAt: tickAt || now,
  });
  console.log(`createTick ${tick.entityId}`);
  const ttlMs = now - (tickAt || now);
  tickRepository.expire(tick.entityId, DEFAULT_EXPIRATION_MS);
  console.log(`run tick in ${ttlMs}ms`);
  scheduleTick(tick);
  return tick;
}

export const observable: Observable<Tick> = new Observable((observer) => {
  subscriber.subscribe(PUBSUB_CHANNEL_NAME, (tickId) => {
    getTickOrThrow(tickId).then((tick) => observer.next(tick));
  });
});

export async function attachTickTimeouts() {
  const ticks = await getTicks();
  console.log(`attachTickTimeouts() to ${ticks.length} ticks`);
  ticks.forEach(scheduleTick);
}
