import { Connection, Keypair, Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js';

export interface GaslessRelayRequest {
  userPublicKey: string;
  serializedTransaction: string;
  targetDApp: string;
}

export class CoinDCXSolanaRelay {
  private connection: Connection;
  private sponsorKeypair: Keypair;
  private allowedPrograms: Set<string>;

  constructor(rpcUrl: string, sponsorPrivateKey: Uint8Array, whitelistedPrograms: string[]) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.sponsorKeypair = Keypair.fromSecretKey(sponsorPrivateKey);
    this.allowedPrograms = new Set(whitelistedPrograms);
  }

  public async relayTransaction(request: GaslessRelayRequest) {
    const txBuffer = Buffer.from(request.serializedTransaction, 'base64');
    const transaction = Transaction.from(txBuffer);
    for (const ix of transaction.instructions) {
      if (!this.allowedPrograms.has(ix.programId.toBase58())) {
        throw new Error(`Unauthorized program instruction: ${ix.programId.toBase58()}`);
      }
    }
    transaction.feePayer = this.sponsorKeypair.publicKey;
    const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.partialSign(this.sponsorKeypair);
    const signature = await sendAndConfirmRawTransaction(this.connection, transaction.serialize(), {
      commitment: 'confirmed',
    });
    return { signature, feeSponsoredLamports: 5000 };
  }
}
