import React, { createContext, useContext } from "react";
import { mockApi } from "./mockAdapter";
import { realApiService } from "./realApiService";

// For backwards compatibility, we'll keep the same API interface
// but use the real API service under the hood
type Api = typeof mockApi;

// Use real API service for production, mock for development if needed
const apiService = realApiService as unknown as Api;

const ApiCtx = createContext<Api>(apiService);

export const ApiProvider = ({ children }: {children: React.ReactNode}) => {
  return <ApiCtx.Provider value={apiService}>{children}</ApiCtx.Provider>;
};

export const useApi = () => useContext(ApiCtx);