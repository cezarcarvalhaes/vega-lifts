// Minimal expo-modules-core stub for jest-expo@52 compatibility in pnpm.
//
// jest-expo's setup.js calls jest.requireActual('expo-modules-core') and
// jest.requireActual('expo-modules-core/src/uuid/uuid.web') — both resolve to
// this stub via moduleNameMapper. The stub must satisfy every property that
// jest-expo's mock factory reads before it builds the final mock object.

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const uuidV5 = () => '';

class EventEmitter {
  addListener() {
    return { remove: () => {} };
  }

  removeListener() {}
  removeAllListeners() {}
  emit() {}
  listenerCount() {
    return 0;
  }
}

class NativeModule {}
class SharedObject {}

// Populate globalThis.expo so jest-expo's setup can destructure from it.
if (!globalThis.expo) {
  globalThis.expo = { modules: {}, EventEmitter, NativeModule, SharedObject };
}

const stub = {
  // uuid — jest-expo reads ExpoModulesCore.uuid.v4 and overwrites it
  uuid: { v4: uuidV4, v5: uuidV5 },
  // NativeModulesProxy — jest-expo iterates its keys to wrap functions
  NativeModulesProxy: {},

  EventEmitter,
  NativeModule,
  SharedObject,

  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => null,
  requireNativeViewManager: () => () => null,
  registerWebModule: (mod) => mod,

  // Exposed as default so requireActual('expo-modules-core/src/uuid/uuid.web')
  // gives jest-expo a { default: { v4, v5 } } shape.
  default: { v4: uuidV4, v5: uuidV5 },
};

module.exports = stub;
