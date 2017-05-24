// @flow

import Deployer from './Deployer';
import type { DeployerOptions } from './Deployer';

export default async (
  options: DeployerOptions,
  eventListeners?: { [string]: (...args: any) => void },
) => {
  const deployer = new Deployer(options);

  if (eventListeners) {
    Object.keys(eventListeners).forEach((name) => {
      deployer.on(name, eventListeners[name]);
    });
  }

  return deployer.execute();
};

export { Deployer };
