import { notificationReducer } from '../Reducer';
import { ADD_NOTIFICATION } from '../ActionTypes';

describe('notification reducer', () => {
  it('adds local notification via ADD_NOTIFICATION', () => {
    const initial = { notifications: [] };
    const action = { type: ADD_NOTIFICATION, payload: { id: 'local-1', title: 'T', body: 'B', type: 'test', createdAt: new Date().toISOString() } };
    const next = notificationReducer(initial, action);
    expect(next.notifications.length).toBe(1);
    expect(next.notifications[0].id).toBe('local-1');
  });
});
