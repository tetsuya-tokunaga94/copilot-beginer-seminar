/**
 * 書籍API クライアント
 *
 * 蔵書管理のREST APIとの通信を行うための関数群
 */

import { apiClient } from './api-client';

// ============================================
// 型定義
// ============================================

/** 書籍マスタ */
export interface Book {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly publicationYear: number | null;
  readonly isbn: string;
  readonly category: string | null;
  readonly pageCount: number | null;
  readonly language: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 書籍登録入力 */
export interface CreateBookInput {
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly publicationYear?: number | null;
  readonly isbn: string;
  readonly category?: string | null;
  readonly pageCount?: number | null;
  readonly language?: string | null;
}

/** 書籍更新入力 */
export interface UpdateBookInput {
  readonly title?: string;
  readonly author?: string;
  readonly publisher?: string | null;
  readonly publicationYear?: number | null;
  readonly isbn?: string;
  readonly category?: string | null;
  readonly pageCount?: number | null;
  readonly language?: string | null;
}

/** APIエラーレスポンス */
export interface BookApiError {
  readonly error: {
    readonly type: 'VALIDATION_ERROR' | 'DUPLICATE_ISBN' | 'NOT_FOUND';
    readonly field?: string;
    readonly message?: string;
    readonly isbn?: string;
    readonly id?: string;
  };
}

// ============================================
// API 関数
// ============================================

const API_BASE = '/api/books';

/**
 * 書籍を登録
 */
export async function createBook(input: CreateBookInput): Promise<Book> {
  return apiClient.post<Book>(API_BASE, input);
}

/**
 * 書籍を更新
 */
export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  return apiClient.put<Book>(`${API_BASE}/${id}`, input);
}

/**
 * 書籍を削除
 */
export async function deleteBook(id: string): Promise<void> {
  return apiClient.delete(`${API_BASE}/${id}`);
}

/**
 * 書籍を取得
 */
export async function getBook(id: string): Promise<Book> {
  return apiClient.get<Book>(`${API_BASE}/${id}`);
}

/**
 * 書籍一覧を取得（検索APIを使用）
 */
export async function getBooks(): Promise<readonly Book[]> {
  return apiClient.get<readonly Book[]>('/api/books/search');
}
