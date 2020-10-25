import Ask from 'https://deno.land/x/ask/mod.ts';
import { exists } from 'https://deno.land/std@0.74.0/fs/exists.ts';
import yargs from 'https://deno.land/x/yargs/deno.ts';
import { WebSocket } from 'https://deno.land/x/websocket@v0.0.5/mod.ts';

import { Block, getAddress, generateSecret, createChainFromFile, addBlock, createBlock, validateChain, getBalance, getMessages } from './chain.ts';
import { broadcastBlock, listen, handshake } from './net.ts';

const chainExists = await exists('./chain.json');
if (!chainExists) throw new Error('Must have a chain file to read from.');
const chain = await createChainFromFile('./chain.json');

const args: any = yargs()
  .array('peers')
  .parse(Deno.args);

const peers = args.peers || [];
const port = args.port || 8080;

const ask = new Ask();

const ws = listen(port, (block: Block) => addBlock(chain, block));

console.log('Welcome to trustline!\n');
const { choice } = await ask.input({
  name: 'choice',
  message: 'Would you like to (login) or (create)',
  validate: (value): boolean => value === 'login' || value === 'create',
});

let secret: string = '';
if (choice === 'login') {
  console.log('Login:');
  const { secretValue } = await ask.input({
    name: 'secretValue',
    message: 'Enter your secret:',
  });
  secret = secretValue;
} else {
  secret = generateSecret();
  console.log(`Your generated secret is: ${secret}.`);
  console.log('Keep it safe!\n');
}

const address: string = getAddress(secret);
let peerSockets: Array<WebSocket> = [];
try {
  peerSockets = await handshake(peers, address);
} catch (err) {
  console.error('Unable to connect to one of the peers. Retrying...');
  setTimeout(() => {

  }, 3000);
}
console.log(`Successfully logged in!`);
console.log(`Address: ${address}`);

while (true) {
  const { action } = await ask.input({
    name: 'action',
    message: '',
    prefix: '>',
  });

  if (action === 'quit' || action === 'q' || action === 'exit') {
    ws.close();
    break;
  } else if (action === 'pay') {
    const { to, amount } = await ask.prompt([
      {
        name: 'to',
        'type': 'input',
        message: 'Payee Address',
      },
      {
        name: 'amount',
        'type': 'number',
        message: 'Amount to Send',
      },
    ]);

    try {
      const block = await createBlock(chain, amount, '', address, to, secret);
      broadcastBlock(peerSockets, block);
      console.log(`Paid ${amount} to ${to}!`);
    } catch (err) {
      console.log(`Unable to create block: ${err}`);
    }
  } else if (action === 'balance') {
    console.log(getBalance(chain, address));
  } else if (action === 'save') {
    await Deno.writeTextFile('./chain.json', JSON.stringify(chain));
    console.log('Saved chain locally.');
  } else if (action === 'validate') {
    if (validateChain(chain)) {
      console.log('Chain is currently valid!');
    } else {
      console.log('Your chain is corrupted.');
    }
  } else if (action === 'message') {
    const { message, to } = await ask.prompt([
      {
        name: 'to',
        'type': 'input',
        message: 'Who to send the message to',
      },
      {
        name: 'message',
        'type': 'input',
        message: 'What would you like to send',
      }
    ]);
    try {
      const block = await createBlock(chain, 0, message, address, to, secret);
      broadcastBlock(peerSockets, block);
    } catch (err) {
      console.log(`Unable to create block: ${err}`);
    }
  } else if (action === 'view') {
    console.log(getMessages(chain, address));
  }
}

