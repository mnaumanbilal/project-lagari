type AuthHandlers = {
  onUnauthorized: () => void;
  onTokenRefreshed: (accessToken: string) => void;
};

let handlers: AuthHandlers | null = null;

export function registerAuthHandlers(next: AuthHandlers | null): void {
  handlers = next;
}

export function notifyUnauthorized(): void {
  handlers?.onUnauthorized();
}

export function notifyTokenRefreshed(accessToken: string): void {
  handlers?.onTokenRefreshed(accessToken);
}
