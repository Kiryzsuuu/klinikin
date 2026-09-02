declare module "midtrans-client" {
  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: unknown): Promise<{ token: string; redirect_url: string }>;
  }
  const _default: { Snap: typeof Snap };
  export default _default;
}
