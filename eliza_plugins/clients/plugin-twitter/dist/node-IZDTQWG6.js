// src/client/platform/node/randomize-ciphers.ts
import { randomBytes } from "node:crypto";
import tls from "node:tls";
var ORIGINAL_CIPHERS = tls.DEFAULT_CIPHERS;
var TOP_N_SHUFFLE = 8;
var shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUint32LE() % array.length;
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
var randomizeCiphers = () => {
  do {
    const cipherList = ORIGINAL_CIPHERS.split(":");
    const shuffled = shuffleArray(cipherList.slice(0, TOP_N_SHUFFLE));
    const retained = cipherList.slice(TOP_N_SHUFFLE);
    tls.DEFAULT_CIPHERS = [...shuffled, ...retained].join(":");
  } while (tls.DEFAULT_CIPHERS === ORIGINAL_CIPHERS);
};

// src/client/platform/node/index.ts
var NodePlatform = class {
  /**
   * Asynchronously randomizes ciphers.
   *
   * @returns {Promise<void>} A promise that resolves once the ciphers are randomized.
   */
  randomizeCiphers() {
    randomizeCiphers();
    return Promise.resolve();
  }
};
var platform = new NodePlatform();
export {
  platform
};
//# sourceMappingURL=node-IZDTQWG6.js.map