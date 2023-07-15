import Database from "better-sqlite3";
import { DroppedItemService } from "./engine/DroppedItemService";
import { ItemService } from "./engine/ItemService";
import { WorldMapService } from "./engine/WorldMapService";
import { OnlineService } from "./engine/OnlineService";
import { PlayerService } from "./engine/PlayerService";
import { WalkService } from "./engine/WalkService";
import { SessionService } from "./engine/SessionService";
import { InventoryService } from "./engine/InventoryService";
import { ServerEventService } from "./engine/ServerEventService";
import { AuthService } from "./engine/AuthService";
import { JSONStore } from "@wwyb/entitydb";
import type { ConfigServer } from "./configServer";
import { configServer } from "./configServer";
import { BotService } from "./engine/BotService";
import { CharacterCustomizationService } from "./engine/CharacterCustomizationService";

export function buildContainer(providedConfig: Partial<ConfigServer> = {}) {
  const config = { ...configServer, ...providedConfig };

  const db = new Database(config.dbFilePath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = off");
  const jsonStore = new JSONStore(db);

  const worldMapService = new WorldMapService(
    config.obstacleLayerName,
    config.playerVisibility,
    config.mapPath
  );

  const onlineService = new OnlineService(config.idleLogoutMs);
  const playerService = new PlayerService(
    jsonStore,
    worldMapService,
    onlineService,
    config.playerVisibility,
    config.spawnPosition
  );
  const botService = new BotService(
    jsonStore,
    playerService,
    config.maxBotsPerPlayer
  );
  const characterCustomizationService = new CharacterCustomizationService(
    playerService,
    config.assetsPath
  );
  const sessionService = new SessionService(
    playerService,
    config.sessionSecret,
    config.userSessionKey
  );
  const authService = new AuthService(
    sessionService,
    playerService,
    botService,
    config.discordClientId,
    config.discordClientSecret,
    config.discordCallbackUrl
  );

  const clientEventService = new ServerEventService(playerService);

  const walkService = new WalkService(
    clientEventService,
    worldMapService,
    playerService,
    onlineService
  );
  const droppedItemService = new DroppedItemService(config.items);
  const itemService = new ItemService(
    jsonStore,
    droppedItemService,
    config.items
  );

  // const equipmentService = new EquipmentService(itemService);
  // const combatStatsService = new CombatStatsService(
  //   itemService,
  //   equipmentService
  // );
  // const npcService = new NpcService(npcRepo, droppedItemService);
  // const spawnService = new SpawnService(npcService, mapService);
  // const combatService = new CombatService(
  //   playerService,
  //   npcService,
  //   droppedItemService
  // );
  const inventoryService = new InventoryService(
    itemService,
    droppedItemService
  );
  // const avatarService = new AvatarService(playerService);

  return {
    config,
    db,
    playerService,
    mapService: worldMapService,
    walkService,
    itemService,
    droppedItemService,
    sessionService,
    clientEventService,
    authService,
    onlineService,
    // npcService,
    // equipmentService,
    // avatarService,
    // combatStatsService,
    inventoryService,
    // spawnService,
    // combatService,
    botService,
    characterCustomizationService,
  };
}

export const container = buildContainer();

export type Container = ReturnType<typeof buildContainer>;
