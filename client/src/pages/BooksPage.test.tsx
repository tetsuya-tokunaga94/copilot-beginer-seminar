/**
 * BooksPage テスト
 *
 * 蔵書管理画面のテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooksPage } from './BooksPage';
import * as bookApi from '../lib/book-api';
import type { Book } from '../lib/book-api';

// API モック
vi.mock('../lib/book-api');

const mockBooks: readonly Book[] = [
  {
    id: 'book-1',
    title: 'TypeScript入門',
    author: '山田太郎',
    publisher: '技術評論社',
    publicationYear: 2024,
    isbn: '9784123456789',
    category: 'プログラミング',
    pageCount: null,
    language: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'book-2',
    title: 'React実践ガイド',
    author: '佐藤花子',
    publisher: 'オライリー・ジャパン',
    publicationYear: 2023,
    isbn: '9784987654321',
    category: 'プログラミング',
    pageCount: null,
    language: null,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  },
];

describe('BooksPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(bookApi.getBooks).mockResolvedValue(mockBooks);
  });

  describe('画面表示', () => {
    it('ページタイトルが表示される', async () => {
      render(<BooksPage />);
      
      expect(screen.getByRole('heading', { name: '書籍一覧' })).toBeInTheDocument();
    });

    it('書籍登録ボタンが表示される', async () => {
      render(<BooksPage />);
      
      expect(screen.getByRole('button', { name: '書籍を登録' })).toBeInTheDocument();
    });

    it('書籍一覧が表示される', async () => {
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
        expect(screen.getByText('React実践ガイド')).toBeInTheDocument();
      });
    });

    it('データ取得中はローディング表示', async () => {
      vi.mocked(bookApi.getBooks).mockImplementation(
        () => new Promise(() => {})
      );
      
      render(<BooksPage />);
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('書籍登録フォーム', () => {
    it('登録ボタンクリックでフォームが表示される', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      await user.click(screen.getByRole('button', { name: '書籍を登録' }));
      
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
      expect(screen.getByLabelText(/著者/)).toBeInTheDocument();
      expect(screen.getByLabelText(/ISBN/)).toBeInTheDocument();
    });

    it('必須項目が未入力の場合はバリデーションエラー', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      // 書籍一覧のロードを待つ
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: '書籍を登録' }));
      
      // フォームが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
      });
      
      // 何も入力せずに登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: '登録' }));
      
      await waitFor(() => {
        expect(screen.getAllByText('この項目は必須です').length).toBeGreaterThan(0);
      });
    });

    it('正常に登録できる', async () => {
      const user = userEvent.setup();
      const newBook: Book = {
        id: 'book-3',
        title: 'Node.js完全ガイド',
        author: '田中次郎',
        publisher: 'テスト出版社',
        publicationYear: null,
        isbn: '9781234567890',
        category: null,
        pageCount: null,
        language: null,
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
      };
      vi.mocked(bookApi.createBook).mockResolvedValue(newBook);
      vi.mocked(bookApi.getBooks).mockResolvedValue([...mockBooks, newBook]);
      
      render(<BooksPage />);
      
      await user.click(screen.getByRole('button', { name: '書籍を登録' }));
      
      await user.type(screen.getByLabelText(/タイトル/), 'Node.js完全ガイド');
      await user.type(screen.getByLabelText(/著者/), '田中次郎');
      await user.type(screen.getByLabelText(/ISBN/), '9781234567890');
      await user.type(screen.getByLabelText(/出版社/), 'テスト出版社');
      
      await user.click(screen.getByRole('button', { name: '登録' }));
      
      await waitFor(() => {
        expect(bookApi.createBook).toHaveBeenCalledWith({
          title: 'Node.js完全ガイド',
          author: '田中次郎',
          publisher: 'テスト出版社',
          publicationYear: null,
          isbn: '9781234567890',
          category: null,
          pageCount: null,
          language: null,
        });
      });
    });

    it('出版社が未入力の場合はバリデーションエラー', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      // 書籍一覧のロードを待つ
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: '書籍を登録' }));
      
      // フォームが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
      });
      
      // 出版社以外の必須項目を入力
      await user.type(screen.getByLabelText(/タイトル/), 'テスト書籍');
      await user.type(screen.getByLabelText(/著者/), 'テスト著者');
      await user.type(screen.getByLabelText(/ISBN/), '9781234567890');
      
      // 出版社を入力せずに登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: '登録' }));
      
      await waitFor(() => {
        expect(screen.getByText('この項目は必須です')).toBeInTheDocument();
      });
      
      // createBook が呼ばれていないことを確認
      expect(bookApi.createBook).not.toHaveBeenCalled();
    });

    it('ISBN重複エラーが表示される', async () => {
      const user = userEvent.setup();
      vi.mocked(bookApi.createBook).mockRejectedValue({
        status: 409,
        data: { error: { type: 'DUPLICATE_ISBN', isbn: '9784123456789' } },
      });
      
      render(<BooksPage />);
      
      await user.click(screen.getByRole('button', { name: '書籍を登録' }));
      
      await user.type(screen.getByLabelText(/タイトル/), 'テスト書籍');
      await user.type(screen.getByLabelText(/著者/), 'テスト著者');
      await user.type(screen.getByLabelText(/ISBN/), '9784123456789');
      await user.type(screen.getByLabelText(/出版社/), 'テスト出版社');
      
      await user.click(screen.getByRole('button', { name: '登録' }));
      
      await waitFor(() => {
        expect(screen.getByText(/ISBN.*既に登録されています/)).toBeInTheDocument();
      });
    });
  });

  describe('書籍編集', () => {
    it('編集ボタンクリックで編集フォームが表示される', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: '編集' });
      await user.click(editButtons[0]!);
      
      expect(screen.getByDisplayValue('TypeScript入門')).toBeInTheDocument();
    });

    it('正常に編集できる', async () => {
      const user = userEvent.setup();
      const updatedBook: Book = {
        ...mockBooks[0]!,
        title: 'TypeScript入門 改訂版',
      };
      vi.mocked(bookApi.updateBook).mockResolvedValue(updatedBook);
      vi.mocked(bookApi.getBooks)
        .mockResolvedValueOnce(mockBooks)
        .mockResolvedValueOnce([updatedBook, mockBooks[1]!]);
      
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: '編集' });
      await user.click(editButtons[0]!);
      
      const titleInput = screen.getByDisplayValue('TypeScript入門');
      await user.clear(titleInput);
      await user.type(titleInput, 'TypeScript入門 改訂版');
      
      await user.click(screen.getByRole('button', { name: '更新' }));
      
      await waitFor(() => {
        expect(bookApi.updateBook).toHaveBeenCalledWith('book-1', {
          title: 'TypeScript入門 改訂版',
          author: '山田太郎',
          publisher: '技術評論社',
          publicationYear: 2024,
          isbn: '9784123456789',
          category: 'プログラミング',
          pageCount: null,
          language: null,
        });
      });
    });
  });

  describe('書籍削除', () => {
    it('削除ボタンクリックで確認ダイアログが表示される', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: '削除' });
      await user.click(deleteButtons[0]!);
      
      expect(screen.getByText('書籍を削除しますか？')).toBeInTheDocument();
    });

    it('確認ダイアログでキャンセルすると削除されない', async () => {
      const user = userEvent.setup();
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: '削除' });
      await user.click(deleteButtons[0]!);
      
      await user.click(screen.getByRole('button', { name: 'キャンセル' }));
      
      expect(bookApi.deleteBook).not.toHaveBeenCalled();
    });

    it('確認ダイアログで確認すると削除される', async () => {
      const user = userEvent.setup();
      vi.mocked(bookApi.deleteBook).mockResolvedValue();
      vi.mocked(bookApi.getBooks)
        .mockResolvedValueOnce(mockBooks)
        .mockResolvedValueOnce([mockBooks[1]!]);
      
      render(<BooksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: '削除' });
      await user.click(deleteButtons[0]!);
      
      await user.click(screen.getByRole('button', { name: '削除する' }));
      
      await waitFor(() => {
        expect(bookApi.deleteBook).toHaveBeenCalledWith('book-1');
      });
    });
  });
});
