// Example data shapes (JSDoc for editor intellisense)
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} name
 * @property {number} quantity
 * @property {number} price
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id
 * @property {string} orderNumber
 * @property {Date} createdAt
 * @property {'pending' | 'approved' | 'rejected'} status
 * @property {OrderItem[]} items
 * @property {number} totalAmount
 */

// Export an empty object so the module can be imported if needed.
export const types = {};
