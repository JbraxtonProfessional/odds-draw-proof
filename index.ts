/**
 * Odds DrawProof — dependency-free draw integrity verifier.
 * Uses Web Crypto when available, Node crypto otherwise.
 */

export type OddsTableEntry = {
  id: string;
  weight: number;
  label?: string;
};

export type VerifyDrawInput = {
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  publishedHash: string;
  oddsTable: OddsTableEntry[];
};

export type VerifyDrawResult = {
  computedHash: string;
  matchesPublishedHash: boolean;
  roll: number;
  resolvedItem: OddsTableEntry | null;
};

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value),
    );
    return bufferToHex(digest);
  }

  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Match Odds open-box: first 12 hex chars / 2^48 → [0, 1). */
export function hexToUnitInterval(hex: string): number {
  const slice = hex.slice(0, 12);
  const value = Number.parseInt(slice, 16);
  return value / 0x1_0000_0000_0000;
}

/** Walk cumulative weights; same rule as open-box pickByRoll. */
export function resolveItemFromRoll(
  oddsTable: OddsTableEntry[],
  roll: number,
): OddsTableEntry | null {
  if (!Array.isArray(oddsTable) || oddsTable.length === 0) {
    return null;
  }

  const totalWeight = oddsTable.reduce((sum, entry) => {
    const weight = Number(entry.weight);
    return sum + (Number.isFinite(weight) && weight > 0 ? weight : 0);
  }, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let cumulative = 0;
  for (const entry of oddsTable) {
    const weight = Number(entry.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      continue;
    }
    cumulative += weight / totalWeight;
    if (roll < cumulative) {
      return entry;
    }
  }

  return oddsTable[oddsTable.length - 1] ?? null;
}

export async function verifyDraw(
  input: VerifyDrawInput,
): Promise<VerifyDrawResult> {
  const serverSeed = String(input?.serverSeed ?? '');
  const clientSeed = String(input?.clientSeed ?? '');
  const nonce = String(input?.nonce ?? '');
  const publishedHash = String(input?.publishedHash ?? '')
    .trim()
    .toLowerCase();
  const oddsTable = Array.isArray(input?.oddsTable) ? input.oddsTable : [];

  const computedHash = await sha256Hex(serverSeed);
  const digest = await sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
  const roll = hexToUnitInterval(digest);
  const resolvedItem = resolveItemFromRoll(oddsTable, roll);

  return {
    computedHash,
    matchesPublishedHash: computedHash === publishedHash,
    roll,
    resolvedItem,
  };
}
