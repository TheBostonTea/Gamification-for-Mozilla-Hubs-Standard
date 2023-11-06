import { NetworkedDoor } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { isOpen, testString }: { isOpen: number, testString: string } = data;
  write(NetworkedDoor.isOpen, eid, isOpen);
  write(NetworkedDoor.testString, eid, APP.getString(NetworkedDoor.testString[eid]));
  console.log("Write changes!");
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedDoor);
export const NetworkedDoorSchema: NetworkSchema = {
  componentName: "networked-door",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        isOpen: read(NetworkedDoor.isOpen, eid),
        testString: APP.getSid(read(NetworkedDoor.testString, eid))
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};