# Odds DrawProof

Independent, dependency-free verifier for **Odds draw outcome integrity**.

Given the revealed seeds and the odds table that was locked in for a purchase, anyone can recompute:

1. `sha256(serverSeed)` and check it against the **published** `server_seed_hash`
2. The roll from `sha256(serverSeed:clientSeed:nonce)` normalized to `[0, 1)`
3. Which item that roll selects by walking cumulative weights

If the hash matches and the resolved item matches what you were shown, the outcome was not swapped after the commitment.

## Install

```bash
npm install odds-draw-proof
```

## Usage

```ts
import { verifyDraw } from 'odds-draw-proof';

const result = await verifyDraw({
  serverSeed: '...',
  clientSeed: '...',
  nonce: '...',
  publishedHash: '...', // server_seed_hash published at open time
  oddsTable: [
    { id: 'item-a', weight: 1000, label: 'Watch A' },
    { id: 'item-b', weight: 100, label: 'Watch B' },
  ],
});

console.log(result.matchesPublishedHash); // true if seed matches commitment
console.log(result.resolvedItem); // which row the roll selects
```

Uses the Web Crypto API in browsers / Deno, and Node’s built-in `crypto` otherwise. No third-party packages.

## What this proves

- The server seed that produced the roll is the same seed whose hash was committed
- The roll → item mapping follows the published odds table (weights)

## What this does **not** prove

- That the odds themselves are fair or favorable to the player
- That the house edge is small or “good”

That math belongs to **[odds-edge-proof](https://github.com/JbraxtonProfessional/odds-edge-proof)** — EdgeProof checks whether a stated edge is consistent with the displayed value/weight table, not whether you should like that edge.
