declare module "bn.js" {
  export default class BN {
    constructor(value: number | string);
    toNumber(): number;
    toString(): string;
    gtn(value: number): boolean;
    lten(value: number): boolean;
    gt(value: BN): boolean;
    add(value: BN): BN;
    sub(value: BN): BN;
    mul(value: BN): BN;
    muln(value: number): BN;
    div(value: BN): BN;
    pow(value: BN): BN;
    static min(left: BN, right: BN): BN;
  }
}
