import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import AddedThread from '../../Domains/threads/entities/AddedTheread.js';
import ThreadRepository from '../../Domains/threads/ThreadRepository.js';

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(userId, data) {
    const { title, body } = data;
    const id = `thread-${this._idGenerator()}`;
    const created_at = new Date().toISOString();

    const query = {
      text: 'INSERT INTO threads(id, title, body, created_at, owner) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, owner',
      values: [id, title, body, created_at, userId],
    };

    const result = await this._pool.query(query);
    return new AddedThread(result.rows[0]);
  }

  async getThread(id) {
    const query = {
      text: `SELECT 
      threads.id AS thread_id, 
      threads.title, 
      threads.body, 
      threads.created_at AS thread_date, 
      tu.username AS thread_username,

      comments.id AS comment_id,
      comments.content AS comment_content,
      comments.created_at AS comment_date,
      cu.username AS comment_username,

      replies.id AS reply_id,
      replies.content AS reply_content,
      replies.created_at AS reply_date,
      ru.username AS reply_username,

      COUNT(DISTINCT comment_likes.owner) AS like_count

      FROM threads 
      INNER JOIN users tu ON threads.owner = tu.id
      LEFT JOIN comments ON threads.id = comments.thread_id AND comments.parent_id IS NULL
      LEFT JOIN users cu ON comments.owner = cu.id
      LEFT JOIN comments replies ON comments.id = replies.parent_id
      LEFT JOIN users ru ON replies.owner = ru.id
      LEFT JOIN comment_likes ON comments.id = comment_likes.comment_id

      WHERE threads.id = $1

      GROUP BY 
      threads.id, tu.username,
      comments.id, cu.username,
      replies.id, ru.username

      ORDER BY comments.created_at, replies.created_at ASC`,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('thread tidak ditemukan');

    return result.rows;
  }

  async listThreads(limit, offset) {
    const threadsQuery = {
      text: `
        SELECT
        threads.id,
        threads.title,
        threads.body,
        threads.created_at AS date,
        users.username,

        COUNT(DISTINCT comments.id) AS comment_count

        FROM threads
        INNER JOIN users ON threads.owner = users.id
        LEFT JOIN comments ON threads.id = comments.thread_id AND comments.parent_id IS NULL

        GROUP BY threads.id, users.username
        ORDER BY threads.created_at DESC, threads.id DESC
        
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    };

    const countQuery = {
      text: 'SELECT COUNT(*) FROM threads',
    };

    const [threadsResult, countResult] = await Promise.all([
      this._pool.query(threadsQuery),
      this._pool.query(countQuery),
    ]);

    return {
      threads: threadsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        date: row.date,
        username: row.username,
        commentCount: Number(row.comment_count) || 0,
      })),
      total: Number(countResult.rows[0].count),
    };
  }

  async verifyAvailableThread(id) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('thread tidak ditemukan');
  }
}

export default ThreadRepositoryPostgres;
