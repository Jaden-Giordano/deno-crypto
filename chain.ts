import { utils, getPublicKey, sign, verify } from 'https://deno.land/x/secp256k1/mod.ts';

import { fromHex, toHex } from './utils.ts';

export interface BlockData {
  amount: number,
  message: string,
  from: string,
  lastHash: string,
  nonce: number,
  to: string,
}

export interface Block {
  data: BlockData,
  hash: string,
  sig: string,
}

// Chain related functions
const calculateHash = (block: BlockData, secret: string): Promise<Uint8Array> => {
  const data = new TextEncoder().encode(JSON.stringify(block));
  return utils.hmacSha256(fromHex(secret), data);
};

export const createChainFromFile = async (file: string): Promise<Array<Block>> => {
  const text = await Deno.readTextFile(file);
  return JSON.parse(text);
}

export const addBlock = (chain: Array<Block>, block: Block): boolean => {
  const backChain = [...chain, block];
  if (validateChain(backChain)) {
    chain.push(block);
    return true;
  }
  return false;
};

export const createBlock = async (chain: Array<Block>, amount: number = 0, message: string = '', from: string, to: string, secret: string): Promise<Block> => {
  const lastBlock = chain[chain.length - 1];
  const blockData: BlockData = {
    amount,
    message,
    from,
    lastHash: lastBlock.hash,
    nonce: lastBlock.data.nonce + 1,
    to,
  };

  const hash = toHex(await calculateHash(blockData, secret));
  const block: Block = {
    data: blockData,
    hash: hash,
    sig: await sign(hash, secret),
  };

  chain.push(block);

  return block;
};

export const validateChain = (chain: Array<Block>): boolean => {
  // Validate genesis
  if (!verify(chain[0].sig, chain[0].hash, chain[0].data.from)) return false;

  // Validate the rest of the blocks.
  for (let index = 1; index < chain.length; index++) {
    const current = chain[index];
    const last = chain[index - 1];

    // Check if the current block links to the corrrect last block
    // Verify the signature of the block.
    if (last.hash !== current.data.lastHash || !verify(current.sig, current.hash, current.data.from) || current.data.amount < 0) {
      return false;
    }
  }
  return true;
}

export const getBalance = (chain: Array<Block>, address: string): number => {
  // Loop through all the blocks and accumulate the balance.
    // Not really sure how I could speed this up, maybe creating an index but that would need to be created and updated alongside the main block.
  return chain.reduce((acc: number, block: Block, index) => {
    if (index === 0) return acc;
    if (block.data.from === address) {
      return acc - block.data.amount;
    } else if (block.data.to === address) {
      return acc + block.data.amount;
    }
    return acc;
  }, 0);
}

export const getMessages = (chain: Array<Block>, address: string): string => {
  return (chain as any).map((block: Block): string => {
    if (block.data.message && block.data.to === address) {
      return `${block.data.from}: ${block.data.message}\n`;
    }
    return '';
  }).join('');
}

// Address related function
export const generateSecret = (): string => {
  return toHex(utils.randomPrivateKey());
};

export const getAddress = (secret: string): string => {
  return getPublicKey(secret, true);
};
