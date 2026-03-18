import { PluginInterface } from '../../shared/types';
import { EventBus } from '../core/EventBus';
import { Events } from '../../shared/events';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

/**
 * Authentication plugin managing users, sessions, and security constraints.
 */
export class AuthPlugin implements PluginInterface {
  id = 'plugin-auth';
  name = 'Authentication Plugin';

  private db: Database.Database;
  private unsubscribers: (() => void)[] = [];
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds for pilot

  constructor(private eventBus: EventBus) {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.defaultApp;
    const dbPath = path.join(process.cwd(), 'auth.db');
    
    // Reset database on startup in development mode
    if (isDev && fs.existsSync(dbPath)) {
      console.log('[AuthPlugin] Development mode: Resetting test database.');
      fs.unlinkSync(dbPath);
    }

    this.db = new Database(dbPath);
    this.initDatabase();
    if (isDev) {
      this.seedTestUsers();
    }
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        failed_attempts INTEGER DEFAULT 0,
        locked_until INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
  }

  private seedTestUsers() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
      console.log('[AuthPlugin] Seeding test users...');
      const insert = this.db.prepare(
        'INSERT INTO users (username, password_hash, failed_attempts, locked_until) VALUES (?, ?, ?, ?)'
      );
      // Cost factor 12 is acceptable for real prod systems today.
      const hash1 = bcrypt.hashSync('password123', 12);
      insert.run('validuser', hash1, 0, 0);

      const hash2 = bcrypt.hashSync('lockedpassword', 12);
      const lockedUntil = Date.now() + 60 * 60 * 1000; // Locked for 1 hour
      insert.run('lockeduser', hash2, 5, lockedUntil);

      console.log('--- TEST CREDENTIALS ---');
      console.log('User 1: validuser / password123 (Working)');
      console.log('User 2: lockeduser / lockedpassword (Locked)');
      console.log('------------------------');
    }
  }

  async start(): Promise<void> {
    // Listen for Login
    this.unsubscribers.push(
      this.eventBus.subscribe(Events.AUTH_LOGIN_REQUEST, async (event) => {
        const { username, password } = event.payload;

        // Ensure we don't block the main thread completely with slow bcrypt validation
        setImmediate(() => this.handleLogin(username, password));
      })
    );

    // Listen for Register
    this.unsubscribers.push(
      this.eventBus.subscribe(Events.AUTH_REGISTER_REQUEST, async (event) => {
        const { username, password } = event.payload;
        setImmediate(() => this.handleRegister(username, password));
      })
    );
  }

  private handleLogin(username?: string, password?: string) {
    if (!username || !password) {
      this.publishLoginResponse(false, 'Username and password are required.');
      return;
    }

    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      this.publishLoginResponse(false, 'Invalid credentials.');
      return;
    }

    // Check if account is locked
    const now = Date.now();
    if (user.locked_until > now) {
      const waitSeconds = Math.ceil((user.locked_until - now) / 1000);
      this.publishLoginResponse(false, `Account is locked. Try again in ${waitSeconds} seconds.`, true);
      return;
    }

    // Unlocking if lock expired
    if (user.locked_until > 0 && user.locked_until <= now) {
      this.db.prepare('UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?').run(user.id);
      user.failed_attempts = 0;
    }

    // Validate password
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      const attempts = user.failed_attempts + 1;
      let lockedUntil = 0;

      if (attempts >= this.MAX_ATTEMPTS) {
        lockedUntil = now + this.LOCKOUT_DURATION_MS;
      }

      this.db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockedUntil, user.id);

      if (lockedUntil > 0) {
        this.publishLoginResponse(false, `Account is locked. Try again in ${this.LOCKOUT_DURATION_MS / 1000} seconds.`, true);
      } else {
        this.publishLoginResponse(false, 'Invalid credentials.');
      }
      return;
    }

    // Success - reset attempts
    this.db.prepare('UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?').run(user.id);

    // Create a generic session
    const sessionId = Math.random().toString(36).substring(2, 15);
    this.db.prepare('INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)')
      .run(sessionId, user.id, now);

    this.publishLoginResponse(true, undefined, false, sessionId);
  }

  private publishLoginResponse(success: boolean, error?: string, locked?: boolean, sessionId?: string) {
    this.eventBus.publish({
      type: Events.AUTH_LOGIN_RESPONSE,
      payload: { success, error, locked, sessionId },
      timestamp: Date.now(),
      source: this.id
    });
  }

  private handleRegister(username?: string, password?: string) {
    if (!username || !password) {
      this.publishRegisterResponse(false, 'Username and password are required.');
      return;
    }

    try {
      const hash = bcrypt.hashSync(password, 12);
      this.db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
        .run(username, hash);
      this.publishRegisterResponse(true);
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        this.publishRegisterResponse(false, 'Username already exists.');
      } else {
        this.publishRegisterResponse(false, 'Error creating account.');
      }
    }
  }

  private publishRegisterResponse(success: boolean, error?: string) {
    this.eventBus.publish({
      type: Events.AUTH_REGISTER_RESPONSE,
      payload: { success, error },
      timestamp: Date.now(),
      source: this.id
    });
  }

  async stop(): Promise<void> {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    if (this.db) {
      this.db.close();
    }
  }
}
