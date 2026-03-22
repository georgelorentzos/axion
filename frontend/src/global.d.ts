declare global {
  interface Window {
    _ws?: {
      ws: WebSocket;
      state: {
        open: boolean;
        messages: string[];
      };
    };
    GLOBAL_ENV: {
      API_ENDPOINT: string;
      GATEWAY_ENDPOINT: string;
      PRIMARY_DOMAIN: string;
      BUILD_NUMBER: string;
      ENVIRONMENT: string;
    };
  }
}

export {};