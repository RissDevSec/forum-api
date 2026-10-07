import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import AddThread from '../../../Domains/threads/entities/AddThread.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AddedThread from '../../../Domains/threads/entities/AddedTheread.js';

describe('ThreadRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123' });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist add thread and return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'thread title',
        body: 'thread body',
      });

      const UserId = 'user-123';
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await threadRepositoryPostgres.addThread(UserId, addThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadById('thread-123');
      expect(thread).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'thread title',
        body: 'thread body',
      });

      const UserId = 'user-123';
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(
        UserId,
        addThread,
      );

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-123',
          title: 'thread title',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('getThread function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Assert
      await expect(
        threadRepositoryPostgres.getThread('thread-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should return thread correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getThread('thread-123');

      // Assert
      expect(thread[0].thread_id).toBe('thread-123');
    });
  });

  describe('listThreads function', () => {
    it('should return threads correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-456',
        owner: 'user-123',
        createdAt: '2026-01-02T00:00:00.000Z',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threads = await threadRepositoryPostgres.listThreads(10, 0);

      // Assert
      expect(threads.total).toBe(2);
      expect(threads.threads[0].id).toBe('thread-456');
      expect(threads.threads[1].id).toBe('thread-123');
    });
  });

  describe('verifyAvailableThread function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Assert
      await expect(
        threadRepositoryPostgres.verifyAvailableThread('thread-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread exists', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Assert
      await expect(
        threadRepositoryPostgres.verifyAvailableThread('thread-123'),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });
});
