export type Config = {
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
};

export const defaultConfig: Config = {
  portNaming: {
    enable: true,
    portNames: new Map()
  }
};
