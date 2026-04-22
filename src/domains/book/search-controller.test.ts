/**
 * SearchController テスト
 *
 * 検索REST APIエンドポイントのテスト。
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 *
 * Task 3.3: 検索 REST API エンドポイント
 * - GET /api/books/search - 検索実行（クエリパラメータ対応）
 * - ページネーション対応
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createSearchController } from './search-controller.js';
import type { SearchService } from './search-service.js';
import type { SearchBooksResult } from './search-repository.js';
import type { Book } from './types.js';
import type { BookId } from '../../shared/branded-types.js';
import { ok } from '../../shared/result.js';

// ============================================
// モックヘルパー
// ============================================

function createMockSearchService(): SearchService {
  return {
    search: vi.fn(),
  };
}

function createTestApp(searchService: SearchService): Express {
  const app = express();
  app.use(express.json());
  const router = createSearchController(searchService);
  app.use('/api/books', router);
  return app;
}

function createTestBook(overrides?: Partial<Book>): Book {
  return {
    id: 'book-1' as BookId,
    title: 'Test Book',
    author: 'Test Author',
    publisher: 'Test Publisher',
    publicationYear: 2024,
    isbn: '9784123456789',
    category: 'Fiction',
    pageCount: null,
    language: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createSearchResult(books: Book[], total?: number): SearchBooksResult {
  return {
    books,
    total: total ?? books.length,
  };
}

// ============================================
// テスト
// ============================================

describe('SearchController', () => {
  let mockService: SearchService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockSearchService();
    app = createTestApp(mockService);
  });

  // ============================================
  // GET /api/books/search - 検索実行
  // ============================================

  describe('GET /api/books/search - 検索実行', () => {
    it('正常系: キーワードで検索して200を返す', async () => {
      const books = [createTestBook()];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app).get('/api/books/search').query({ keyword: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].title).toBe('Test Book');
      expect(response.body.total).toBe(1);
      expect(mockService.search).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'Test' }));
    });

    it('正常系: ソートパラメータ付きで検索できる', async () => {
      const books = [
        createTestBook({ id: 'book-1' as BookId, title: 'A Book' }),
        createTestBook({ id: 'book-2' as BookId, title: 'B Book' }),
      ];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'Book', sortBy: 'title', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Book',
          sortBy: 'title',
          sortOrder: 'asc',
        })
      );
    });

    it('正常系: 出版年範囲でフィルタリングできる', async () => {
      const books = [createTestBook({ publicationYear: 2023 })];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'Test', publicationYearFrom: '2020', publicationYearTo: '2024' });

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Test',
          publicationYearFrom: 2020,
          publicationYearTo: 2024,
        })
      );
    });

    it('正常系: カテゴリでフィルタリングできる', async () => {
      const books = [createTestBook({ category: 'Fiction' })];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'Test', category: 'Fiction' });

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Test',
          category: 'Fiction',
        })
      );
    });

    it('正常系: 貸出可能のみでフィルタリングできる', async () => {
      const books = [createTestBook()];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'Test', availableOnly: 'true' });

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Test',
          availableOnly: true,
        })
      );
    });

    it('正常系: ページネーション付きで検索できる', async () => {
      const books = [createTestBook()];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books, 50)));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'Test', page: '2', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(50);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(5);
    });

    it('正常系: 検索結果が0件の場合、空配列を返す', async () => {
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult([])));

      const response = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'NonExistent' });

      expect(response.status).toBe(200);
      expect(response.body.books).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('異常系: keywordパラメータがない場合、デフォルト空文字として処理する', async () => {
      const books = [createTestBook()];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app).get('/api/books/search');

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(expect.objectContaining({ keyword: '' }));
    });

    it('正常系: ページネーションのデフォルト値が適用される', async () => {
      const books = [createTestBook()];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books, 1)));

      const response = await request(app).get('/api/books/search').query({ keyword: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(20);
    });

    it('正常系: 複合条件での検索ができる', async () => {
      const books = [createTestBook({ publicationYear: 2023, category: 'Fiction' })];
      vi.mocked(mockService.search).mockResolvedValue(ok(createSearchResult(books)));

      const response = await request(app).get('/api/books/search').query({
        keyword: 'Test',
        publicationYearFrom: '2020',
        publicationYearTo: '2024',
        category: 'Fiction',
        availableOnly: 'true',
        sortBy: 'title',
        sortOrder: 'asc',
        page: '1',
        limit: '10',
      });

      expect(response.status).toBe(200);
      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Test',
          publicationYearFrom: 2020,
          publicationYearTo: 2024,
          category: 'Fiction',
          availableOnly: true,
          sortBy: 'title',
          sortOrder: 'asc',
        })
      );
    });
  });
});
