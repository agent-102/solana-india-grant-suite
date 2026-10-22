import { Connection, PublicKey, Transaction, VersionedTransaction, SimulatedTransactionResponse } from '@solana/web3.js';

export interface SimulationDrainRisk {
  isRisky: boolean;
  drainedLamports: number;
  unauthorizedDelegates: string[];
  reasons: string[];
}

export class SolPulseGuard {
  private connection: Connection;
  private userPublicKey: PublicKey;

  constructor(rpcUrl: string, userPubkeyString: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.userPublicKey = new PublicKey(userPubkeyString);
  }

  public async inspectTransaction(tx: Transaction | VersionedTransaction): Promise<SimulationDrainRisk> {
    const simulation = await (tx instanceof Transaction
      ? this.connection.simulateTransaction(tx)
      : this.connection.simulateTransaction(tx));
    const simValue: SimulatedTransactionResponse = simulation.value;
    if (simValue.err) {
      return {
        isRisky: true,
        drainedLamports: 0,
        unauthorizedDelegates: [],
        reasons: [`Simulation failed: ${JSON.stringify(simValue.err)}`],
      };
    }
    const reasons: string[] = [];
    let drainedLamports = 0;
    if (simValue.logs) {
      for (const log of simValue.logs) {
        if (log.includes('Instruction: Approve') || log.includes('Instruction: SetAuthority')) {
          reasons.push(`Authority delegation detected: "${log.trim()}"`);
        }
      }
    }
    return { isRisky: reasons.length > 0, drainedLamports, unauthorizedDelegates: [], reasons };
  }
}
