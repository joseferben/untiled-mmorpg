import { EventEmitter } from "node:events";
import type { Player } from "./core";
import { initOnce } from "~/utils";
import type { EntityDB } from "./EntityDB/EntityDB";
import { entityDB } from "./EntityDB/EntityDB";

export type ClientEvent = {
  tag: "playerStepped";
  playerId: string;
  x: number;
  y: number;
};

export type PlayerEmitter = {
  id: string;
  playerId: string;
  emitter: Emitter;
};

class Emitter {
  constructor(readonly emitter: EventEmitter) {}

  on(listener: (event: ClientEvent) => void) {
    this.emitter.on("event", listener);
  }
}

export class ClientEventService {
  readonly db!: EntityDB<PlayerEmitter>;
  constructor() {
    [this.db] = initOnce(this.constructor.name, () =>
      entityDB<PlayerEmitter>().withFields(["playerId"]).build()
    );
  }

  sendToAll(event: ClientEvent) {
    this.db.findAll().forEach((playerEmitter) => {
      playerEmitter.emitter.emitter.emit("event", event);
    });
  }

  playerStepped(player: Player, x: number, y: number) {
    this.sendToAll({ tag: "playerStepped", playerId: player.id, x, y });
  }

  playerEmitter(player: Player) {
    const found = this.db.findOneBy("playerId", player.id);
    if (!found) {
      const emitter = new EventEmitter();
      return this.db.create({
        playerId: player.id,
        emitter: new Emitter(emitter),
      });
    }
    return found;
  }
}