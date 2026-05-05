import { describe, it, expect, vi } from 'vitest';
import { notificationBus } from '../patterns/NotificationObserver';

describe('NotificationObserver (Observer Pattern)', () => {
  it('calls a subscribed observer when event fires', () => {
    const mockObserver = vi.fn();
    const unsubscribe = notificationBus.subscribe('new_message', mockObserver);

    notificationBus.notify({
      event: 'new_message',
      title: 'New Message',
      body: 'You have a new message',
      targetUserId: 'user-1',
    });

    expect(mockObserver).toHaveBeenCalledTimes(1);
    expect(mockObserver).toHaveBeenCalledWith(expect.objectContaining({
      event: 'new_message',
      title: 'New Message',
    }));

    unsubscribe();
  });

  it('does not call observer after unsubscribing', () => {
    const mockObserver = vi.fn();
    const unsubscribe = notificationBus.subscribe('material_approved', mockObserver);
    unsubscribe();

    notificationBus.notify({
      event: 'material_approved',
      title: 'Approved',
      body: 'Your material was approved',
      targetUserId: 'user-2',
    });

    expect(mockObserver).not.toHaveBeenCalled();
  });

  it('calls all subscribed observers for the same event', () => {
    const obs1 = vi.fn();
    const obs2 = vi.fn();
    const unsub1 = notificationBus.subscribe('general', obs1);
    const unsub2 = notificationBus.subscribe('general', obs2);

    notificationBus.notify({
      event: 'general',
      title: 'Hello',
      body: 'General notification',
      targetUserId: 'user-3',
    });

    expect(obs1).toHaveBeenCalledTimes(1);
    expect(obs2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it('does not call observer subscribed to different event', () => {
    const obs = vi.fn();
    const unsub = notificationBus.subscribe('tutor_approved', obs);

    notificationBus.notify({
      event: 'new_material',
      title: 'New Material',
      body: 'A material was uploaded',
      targetUserId: 'user-4',
    });

    expect(obs).not.toHaveBeenCalled();
    unsub();
  });

  it('passes full payload to observer', () => {
    const obs = vi.fn();
    const unsub = notificationBus.subscribe('wanted_match', obs);
    const payload = {
      event: 'wanted_match' as const,
      title: 'Match Found',
      body: 'Someone has what you want',
      link: '/materials/123',
      targetUserId: 'user-5',
    };

    notificationBus.notify(payload);
    expect(obs).toHaveBeenCalledWith(payload);
    unsub();
  });
});
