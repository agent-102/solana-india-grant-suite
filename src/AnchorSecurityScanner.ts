export interface IdlAccountField {
  name: string;
  isMut: boolean;
  isSigner: boolean;
}

export interface IdlInstruction {
  name: string;
  accounts: IdlAccountField[];
}

export interface AnchorIdl {
  version: string;
  name: string;
  instructions: IdlInstruction[];
}

export class AnchorSecurityScanner {
  public static scanIdl(idl: AnchorIdl) {
    const findings = [];
    for (const ix of idl.instructions) {
      for (const acc of ix.accounts) {
        const lower = acc.name.toLowerCase();
        if ((lower.includes('authority') || lower.includes('admin') || lower.includes('owner')) && !acc.isSigner) {
          findings.push({
            severity: 'CRITICAL',
            instruction: ix.name,
            account: acc.name,
            ruleId: 'SEC-SOL-001',
            description: `Authority account '${acc.name}' lacks isSigner constraint in '${ix.name}'.`,
          });
        }
      }
    }
    return findings;
  }
}
