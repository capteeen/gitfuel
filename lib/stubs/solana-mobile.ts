export const SolanaMobileWalletAdapterWalletName = "Mobile Wallet Adapter";

export class SolanaMobileWalletAdapter {
  name = SolanaMobileWalletAdapterWalletName;
  constructor(_options?: unknown) {}
  on() {}
  off() {}
  async connect() {}
  async disconnect() {}
  async autoConnect() {}
}

export function createDefaultAddressSelector() {
  return async () => null;
}

export function createDefaultAuthorizationResultCache() {
  return {
    async get() {
      return undefined;
    },
    async set() {},
    async clear() {},
  };
}

export function createDefaultWalletNotFoundHandler() {
  return async () => {};
}
