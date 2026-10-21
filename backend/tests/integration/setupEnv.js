process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://taskuser:taskpass@localhost:5432/taskdb_test';
