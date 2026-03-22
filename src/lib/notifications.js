import Notification from '../models/Notification';

export async function createNotification({ userId, type, title, message, link, entityType, entityId, workspaceId }) {
  try {
    await Notification.create({ userId, type, title, message, link, entityType, entityId, workspaceId });
  } catch (err) {
    console.error('[createNotification]', err.message);
  }
}

export async function notifyMultiple(userIds, data) {
  try {
    const docs = userIds.map((userId) => ({ userId, ...data }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error('[notifyMultiple]', err.message);
  }
}
