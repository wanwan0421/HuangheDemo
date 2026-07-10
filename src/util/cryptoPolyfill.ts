const browserCrypto = globalThis.crypto as Crypto & {
  randomUUID?: () => string;
};

if (
  typeof browserCrypto !== "undefined" &&
  typeof browserCrypto.randomUUID !== "function"
) {
  Object.defineProperty(browserCrypto, "randomUUID", {
    value: () => {
      const bytes = new Uint8Array(16);

      if (typeof browserCrypto.getRandomValues === "function") {
        browserCrypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
          12,
          16
        )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }

      return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    },
    configurable: true,
  });
}