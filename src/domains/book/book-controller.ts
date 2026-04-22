/**
 * BookController - 蔵書管理REST APIコントローラー
 *
 * 蔵書管理のREST APIエンドポイントを提供します。
 *
 * エンドポイント:
 * - POST /api/books - 書籍登録
 * - PUT /api/books/:id - 書籍編集
 * - DELETE /api/books/:id - 書籍削除
 * - GET /api/books/:id - 書籍詳細取得
 * - POST /api/books/:id/copies - 蔵書コピー登録
 */

import { Router, type Request, type Response } from 'express';
import type { BookId } from '../../shared/branded-types.js';
import { isOk } from '../../shared/result.js';
import type { BookService } from './book-service.js';
import type {
  CreateBookInput,
  UpdateBookInput,
  CreateCopyInput,
  BookError,
  BookCopyStatus,
} from './types.js';

// ============================================
// リクエストボディ型定義
// ============================================

/** 書籍登録リクエストボディ */
interface CreateBookRequestBody {
  title?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number | null;
  isbn?: string;
  category?: string | null;
  pageCount?: number | null;
  language?: string | null;
}

/** 書籍更新リクエストボディ */
interface UpdateBookRequestBody {
  title?: string;
  author?: string;
  publisher?: string | null;
  publicationYear?: number | null;
  isbn?: string;
  category?: string | null;
  pageCount?: number | null;
  language?: string | null;
}

/** 蔵書コピー登録リクエストボディ */
interface CreateCopyRequestBody {
  location?: string;
  status?: BookCopyStatus;
}

// ============================================
// HTTPステータスコード決定
// ============================================

/**
 * BookErrorに基づいてHTTPステータスコードを決定
 */
function getErrorStatusCode(error: BookError): number {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'DUPLICATE_ISBN':
      return 409;
  }
}

// ============================================
// コントローラーファクトリ
// ============================================

/**
 * BookControllerを作成
 * @param bookService - BookServiceインスタンス
 * @returns Expressルーター
 */
export function createBookController(bookService: BookService): Router {
  const router = Router();

  // ============================================
  // POST /api/books - 書籍登録
  // ============================================

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateBookRequestBody;
    const input: CreateBookInput = {
      title: body.title ?? '',
      author: body.author ?? '',
      publisher: body.publisher ?? '',
      publicationYear: body.publicationYear ?? null,
      isbn: body.isbn ?? '',
      category: body.category ?? null,
      pageCount: body.pageCount ?? null,
      language: body.language ?? null,
    };

    const result = await bookService.createBook(input);

    if (isOk(result)) {
      res.status(201).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // PUT /api/books/:id - 書籍編集
  // ============================================

  router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const bookId = req.params.id as BookId;
    const body = req.body as UpdateBookRequestBody;

    // 指定されたフィールドのみを更新対象に含める
    const input: UpdateBookInput = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.author !== undefined && { author: body.author }),
      ...(body.publisher !== undefined && { publisher: body.publisher }),
      ...(body.publicationYear !== undefined && { publicationYear: body.publicationYear }),
      ...(body.isbn !== undefined && { isbn: body.isbn }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.pageCount !== undefined && { pageCount: body.pageCount }),
      ...(body.language !== undefined && { language: body.language }),
    };

    const result = await bookService.updateBook(bookId, input);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // DELETE /api/books/:id - 書籍削除
  // ============================================

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const bookId = req.params.id as BookId;

    const result = await bookService.deleteBook(bookId);

    if (isOk(result)) {
      res.status(204).send();
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/books/:id - 書籍詳細取得
  // ============================================

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const bookId = req.params.id as BookId;

    const result = await bookService.getBookById(bookId);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // POST /api/books/:id/copies - 蔵書コピー登録
  // ============================================

  router.post('/:id/copies', async (req: Request, res: Response): Promise<void> => {
    const bookId = req.params.id as BookId;
    const body = req.body as CreateCopyRequestBody;
    const input: CreateCopyInput = {
      location: body.location ?? '',
      ...(body.status !== undefined && { status: body.status }),
    };

    const result = await bookService.createBookCopy(bookId, input);

    if (isOk(result)) {
      res.status(201).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  return router;
}
