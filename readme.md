# How to use this Trustline

First you'll need Deno installed on your computer. You can do that by following instructions here:
https://deno.land/manual@v1.4.4/getting_started/installation

## Creating the genesis block
You'll also need to create the chain with the genesis block in it. I made a script to handle this

``` sh
deno run --allow-write genesis.ts
```

## Starting the client
This is can be run without being connected to any other clients, however I didn't have enough time to implement syncronizing the chains when client connects to its peers so you'll need to make sure both clients are logged in before a transaction is sent.

To start the client, you'll need to set the port to listen to other clients on as well as the ip to the other clients to connect to.

For example on one terminal run:
``` sh
deno run --allow-read --allow-write --allow-net main.ts --peers 127.0.0.1:3001 --port 3000
```

Then on the other:
``` sh
deno run --allow-read --allow-write --allow-net main.ts --peers 127.0.0.1:3000 --port 3001
```

## Using the client
You'll need to create an account just run `create` when prompted; this will give you a private key and an address. You can login by entering your private key if you have one (just enter `login` when prompted).

Make sure each client is logged in before running `pay`. Then you can copy the address of the user to send to then enter the amount. Then run `balance` on both clients to see the balance. If you'd like to inspect the chain after a few transactions just run `save`. Now you can open the `chain.json` file to see the blocks on the chain.
