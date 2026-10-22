import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

export class SolanaSprintVerifier {
  private connection: Connection;
  constructor(endpoint: string = clusterApiUrl('devnet')) {
    this.connection = new Connection(endpoint, 'confirmed');
  }
  public async verifyProgramDeployment(programPubkeyString: string) {
    const pubkey = new PublicKey(programPubkeyString);
    const info = await this.connection.getAccountInfo(pubkey);
    if (!info || !info.executable) {
      throw new Error(`Executable program not found at ${programPubkeyString}`);
    }
    const slot = await this.connection.getSlot('confirmed');
    return {
      programId: pubkey.toBase58(),
      isExecutable: info.executable,
      dataByteLength: info.data.length,
      lamportsBalance: info.lamports,
      deployedSlot: slot,
    };
  }
}
