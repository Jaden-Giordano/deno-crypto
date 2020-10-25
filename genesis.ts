import { utils, getPublicKey, sign } from 'https://deno.land/x/secp256k1/mod.ts';

import { fromHex, toHex } from './utils.ts';

interface GenesisBlock {
  data: {
    from: string,
    nonce: number,
  },
  hash: string,
  sig: string,
};

const privateKey = toHex(utils.randomPrivateKey());
const publicKey = getPublicKey(privateKey, true);
const data = { from: publicKey, nonce: 0 };
const hash = toHex(await utils.hmacSha256(fromHex(publicKey), new TextEncoder().encode(JSON.stringify(data))));
const genesisBlock: GenesisBlock = {
  data,
  hash: hash,
  sig: await sign(hash, privateKey),
};

Deno.writeTextFile('./chain.json', JSON.stringify([genesisBlock]));
