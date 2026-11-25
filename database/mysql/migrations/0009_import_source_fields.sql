-- Imported bibliographic records can lack ISBN, and an ISBN can describe multiple records.
ALTER TABLE books DROP INDEX uq_book_isbn;
ALTER TABLE books MODIFY COLUMN isbn VARCHAR(40) NULL;
CREATE INDEX idx_book_isbn ON books (school_id, isbn);

-- Source inventory descriptions can exceed the original 200-character limit.
ALTER TABLE fixed_assets MODIFY COLUMN name VARCHAR(300) NOT NULL;
