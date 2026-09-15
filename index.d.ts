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

export function sha256Hex(value: string): Promise<string>;
export function hexToUnitInterval(hex: string): number;
export function resolveItemFromRoll(
  oddsTable: OddsTableEntry[],
  roll: number,
): OddsTableEntry | null;
export function verifyDraw(input: VerifyDrawInput): Promise<VerifyDrawResult>;
