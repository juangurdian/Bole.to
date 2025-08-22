import React, { createContext, useContext } from "react";
import { mockApi } from "./mockAdapter";

type Api = typeof mockApi;
const ApiCtx = createContext<Api>(mockApi as Api);

export const ApiProvider = ({ children }: {children: React.ReactNode}) => {
  return <ApiCtx.Provider value={mockApi}>{children}</ApiCtx.Provider>;
};

export const useApi = () => useContext(ApiCtx);