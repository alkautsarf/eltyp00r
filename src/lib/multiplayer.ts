const DEFAULT_SERVER = "https://eltyp00r.elpabl0.xyz";

type EventMap = {
  room_created: { code: string; playerId: string };
  lobby: { players: Array<{ id: string; name: string }> };
  race_start: { text: string };
  opponent_progress: { playerId: string; cursor: number; wpm: number };
  opponent_finish: { playerId: string; wpm: number; accuracy: number; duration: number };
  race_end: { results: Array<{ playerId: string; name: string; wpm: number; accuracy: number; duration: number; rank: number }> };
  player_left: { playerId: string; name: string };
  host_transfer: Record<string, never>;
  error: { message: string };
  disconnected: Record<string, never>;
};

type Listener<K extends keyof EventMap> = (data: EventMap[K]) => void;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Function>>();
  private serverUrl: string;
  private playerName: string;
  private lastProgressSent = 0;

  constructor(serverUrl?: string, playerName?: string) {
    this.serverUrl = serverUrl || DEFAULT_SERVER;
    this.playerName = playerName || "guest";
  }

  async createRoom(): Promise<void> {
    const res = await fetch(`${this.serverUrl}/rooms`, { method: "POST" });
    const { code } = (await res.json()) as { code: string };
    this.connect(code);
  }

  joinRoom(code: string): void {
    this.connect(code);
  }

  sendStart(): void {
    this.send({ type: "start" });
  }

  sendSetPunctuation(value: boolean): void {
    this.send({ type: "set_punctuation", value });
  }

  sendProgress(cursor: number, wpm: number): void {
    const now = Date.now();
    if (now - this.lastProgressSent < 100) return;
    this.lastProgressSent = now;
    this.send({ type: "progress", cursor, wpm });
  }

  sendFinish(wpm: number, accuracy: number, duration: number, errorCount: number, charCount: number): void {
    this.send({ type: "finish", wpm, accuracy, duration, errorCount, charCount });
  }

  leave(): void {
    this.send({ type: "leave" });
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on<K extends keyof EventMap>(event: K, cb: Listener<K>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off<K extends keyof EventMap>(event: K, cb: Listener<K>): void {
    this.listeners.get(event)?.delete(cb);
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private connect(code: string): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const wsUrl = this.serverUrl.replace(/^http/, "ws");
    this.ws = new WebSocket(`${wsUrl}/rooms/${code}/ws?name=${encodeURIComponent(this.playerName)}`);

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.emit("disconnected", {} as EventMap["disconnected"]);
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  private send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(raw: string): void {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type) {
      this.emit(msg.type, msg);
    }
  }

  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      for (const cb of cbs) cb(data);
    }
  }
}
