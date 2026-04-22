import { Migration, createMigration } from './migration.js';

/**
 * Create Books table migration
 */
export function createBooksTableMigration(): Migration {
  return createMigration({
    name: '001_create_books_table',
    up: `
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(300) NOT NULL,
  publisher VARCHAR(300),
  publication_year INTEGER,
  isbn VARCHAR(13) NOT NULL UNIQUE,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
`,
    down: 'DROP TABLE IF EXISTS books;',
  });
}

/**
 * Create BookCopies table migration
 */
export function createBookCopiesTableMigration(): Migration {
  return createMigration({
    name: '002_create_book_copies_table',
    up: `
CREATE TABLE IF NOT EXISTS book_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'MAINTENANCE')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_status ON book_copies(status);
CREATE INDEX IF NOT EXISTS idx_book_copies_book_id_status ON book_copies(book_id, status);
`,
    down: 'DROP TABLE IF EXISTS book_copies;',
  });
}

/**
 * Create Users table migration
 */
export function createUsersTableMigration(): Migration {
  return createMigration({
    name: '003_create_users_table',
    up: `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500),
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(20),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  loan_limit INTEGER NOT NULL DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
`,
    down: 'DROP TABLE IF EXISTS users;',
  });
}

/**
 * Create Loans table migration
 */
export function createLoansTableMigration(): Migration {
  return createMigration({
    name: '004_create_loans_table',
    up: `
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
  borrowed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_copy_id ON loans(book_copy_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id_returned_at ON loans(user_id, returned_at);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
`,
    down: 'DROP TABLE IF EXISTS loans;',
  });
}

/**
 * Create Reservations table migration
 */
export function createReservationsTableMigration(): Migration {
  return createMigration({
    name: '005_create_reservations_table',
    up: `
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'NOTIFIED', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
  queue_position INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id_status ON reservations(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
`,
    down: 'DROP TABLE IF EXISTS reservations;',
  });
}

/**
 * Create OverdueRecords table migration
 */
export function createOverdueRecordsTableMigration(): Migration {
  return createMigration({
    name: '006_create_overdue_records_table',
    up: `
CREATE TABLE IF NOT EXISTS overdue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  overdue_days INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overdue_records_loan_id ON overdue_records(loan_id);
`,
    down: 'DROP TABLE IF EXISTS overdue_records;',
  });
}

/**
 * Create Full Text Search GIN index migration
 */
export function createFullTextSearchIndexMigration(): Migration {
  return createMigration({
    name: '007_create_full_text_search_index',
    up: `
CREATE INDEX IF NOT EXISTS idx_books_fulltext ON books USING GIN (to_tsvector('english', title || ' ' || author));
`,
    down: 'DROP INDEX IF EXISTS idx_books_fulltext;',
  });
}

/**
 * Alter books table to make publisher NOT NULL migration
 */
export function alterBooksPublisherNotNullMigration(): Migration {
  return createMigration({
    name: '008_alter_books_publisher_not_null',
    up: `
-- 既存データの更新（publisher が NULL の場合は '不明' を設定）
UPDATE books SET publisher = '不明' WHERE publisher IS NULL;

-- NOT NULL 制約の追加
ALTER TABLE books ALTER COLUMN publisher SET NOT NULL;
`,
    down: 'ALTER TABLE books ALTER COLUMN publisher DROP NOT NULL;',
  });
}

/**
 * Add page_count and language columns to books table migration
 */
export function addPageCountAndLanguageToBooksMigration(): Migration {
  return createMigration({
    name: '009_add_page_count_and_language_to_books',
    up: `
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(100);
`,
    down: `
ALTER TABLE books DROP COLUMN IF EXISTS page_count;
ALTER TABLE books DROP COLUMN IF EXISTS language;
`,
  });
}

/**
 * Get all migrations in order
 */
export function getAllMigrations(): Migration[] {
  return [
    createBooksTableMigration(),
    createBookCopiesTableMigration(),
    createUsersTableMigration(),
    createLoansTableMigration(),
    createReservationsTableMigration(),
    createOverdueRecordsTableMigration(),
    createFullTextSearchIndexMigration(),
    alterBooksPublisherNotNullMigration(),
    addPageCountAndLanguageToBooksMigration(),
  ];
}
