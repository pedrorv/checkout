import { type ComponentType, type LazyExoticComponent, lazy } from "react";

export const lazyNamed = <TModule, TKey extends keyof TModule>(
  importModule: () => Promise<TModule>,
  exportName: TKey,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => ({
    default: (await importModule())[exportName] as ComponentType,
  }));
