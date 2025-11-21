// API calls instead
// This file is kept for compatibility but should not be used in frontend

export class DatabaseClient {
  async query() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async select() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async insert() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async update() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async delete() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async count() {
    throw new Error('Database client not available in browser. Use API calls instead.');
  }

  async close() {
  }
}

export const db = new DatabaseClient();