declare module 'protocol-numbers' {
  interface Protocol {
    name: string;
    value: string;
  }
  declare const protocols: { [key: string]: Protocol };
  export default protocols;
}
