// Observer Pattern - pub/sub for notifications
type NotificationEvent = 'material_approved' | 'material_rejected' | 'new_material' | 'new_message' | 'wanted_match' | 'tutor_approved' | 'general';

interface NotificationPayload {
  event: NotificationEvent;
  title: string;
  body: string;
  link?: string;
  targetUserId: string;
}

type Observer = (payload: NotificationPayload) => void;

class NotificationSubject {
  private observers: Map<string, Observer[]> = new Map();

  subscribe(event: string, observer: Observer): () => void {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event)!.push(observer);
    return () => this.unsubscribe(event, observer);
  }

  unsubscribe(event: string, observer: Observer): void {
    const list = this.observers.get(event);
    if (list) {
      const idx = list.indexOf(observer);
      if (idx > -1) list.splice(idx, 1);
    }
  }

  notify(payload: NotificationPayload): void {
    const handlers = this.observers.get(payload.event) || [];
    const allHandlers = this.observers.get('*') || [];
    [...handlers, ...allHandlers].forEach(h => h(payload));
  }
}

// Singleton instance shared across app
export const notificationBus = new NotificationSubject();
