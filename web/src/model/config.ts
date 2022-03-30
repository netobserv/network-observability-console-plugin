import * as React from 'react';

export type Config = {
  portNaming: {
    Enable: boolean;
    portNames: Map<string, string>;
  };
};

export const ConfigContext = React.createContext(<Config>{
  portNaming: { Enable: true, portNames: new Map<string, string>() }
});
