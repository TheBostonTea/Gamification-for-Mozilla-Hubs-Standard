import { NetworkedGame4dobject} from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { varid, updates, actid, actions }: { varid: number, updates: string, actid: number, actions: string } = data;
  write(NetworkedGame4dobject.varid, eid, varid);
  write(NetworkedGame4dobject.updates, eid, APP.getSid(updates));
  write(NetworkedGame4dobject.actid, eid, actid);
  write(NetworkedGame4dobject.actions, eid, APP.getSid(actions));

  // console.log("Write changes!");
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedGame4dobject);
export const NetworkedG4DObjectSchema: NetworkSchema = {
  componentName: "networked-game4dobject",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        varid: read(NetworkedGame4dobject.varid, eid),
        updates: APP.getString(read(NetworkedGame4dobject.updates, eid)),
        actid: read(NetworkedGame4dobject.actid, eid),
        actions: APP.getString(read(NetworkedGame4dobject.actions, eid))
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};