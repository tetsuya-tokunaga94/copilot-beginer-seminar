import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { FormInput, DataTable, ConfirmDialog, Alert, type Column } from '../components';
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  type Book,
  type CreateBookInput,
  type UpdateBookInput,
} from '../lib';

// ============================================
// 型定義
// ============================================

/** フォームモード */
type FormMode = 'create' | 'edit';

/** 書籍フォームデータ */
interface BookFormData {
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn: string;
  category: string;
  pageCount: string;
  language: string;
}

/** アラート情報 */
interface AlertInfo {
  message: string;
  type: 'success' | 'error';
}

// ============================================
// 初期値
// ============================================

const initialFormData: BookFormData = {
  title: '',
  author: '',
  publisher: '',
  publicationYear: '',
  isbn: '',
  category: '',
  pageCount: '',
  language: '',
};

// ============================================
// カラム定義
// ============================================

const createColumns = (
  onEdit: (book: Book) => void,
  onDelete: (book: Book) => void
): Column<Book>[] => [
  { key: 'title', header: 'タイトル', sortable: true },
  { key: 'author', header: '著者', sortable: true },
  { key: 'isbn', header: 'ISBN' },
  { key: 'publisher', header: '出版社' },
  { key: 'publicationYear', header: '出版年', render: (book) => book.publicationYear?.toString() ?? '-' },
  { key: 'category', header: 'カテゴリ', render: (book) => book.category ?? '-' },
  {
    key: 'id',
    header: '操作',
    render: (book) => (
      <div className="books-page-actions">
        <button
          type="button"
          className="books-page-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(book);
          }}
        >
          編集
        </button>
        <button
          type="button"
          className="books-page-action-button books-page-action-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book);
          }}
        >
          削除
        </button>
      </div>
    ),
  },
];

// ============================================
// コンポーネント
// ============================================

/**
 * 書籍一覧ページ
 */
export function BooksPage(): React.ReactElement {
  // ステート
  const [books, setBooks] = useState<readonly Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 書籍一覧を取得
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch {
      setAlert({ message: '書籍一覧の取得に失敗しました', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  // フォームを開く（新規登録）
  const handleOpenCreateForm = useCallback(() => {
    setFormData(initialFormData);
    setFormErrors({});
    setEditingBook(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  // フォームを開く（編集）
  const handleOpenEditForm = useCallback((book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher ?? '',
      publicationYear: book.publicationYear?.toString() ?? '',
      isbn: book.isbn,
      category: book.category ?? '',
      pageCount: book.pageCount?.toString() ?? '',
      language: book.language ?? '',
    });
    setFormErrors({});
    setEditingBook(book);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  // フォームを閉じる
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setFormData(initialFormData);
    setFormErrors({});
    setEditingBook(null);
  }, []);

  // フォーム入力変更
  const handleFormChange = useCallback((field: keyof BookFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // バリデーション
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof BookFormData, string>> = {};

    if (formData.title.trim() === '') {
      errors.title = 'この項目は必須です';
    }
    if (formData.author.trim() === '') {
      errors.author = 'この項目は必須です';
    }
    if (formData.isbn.trim() === '') {
      errors.isbn = 'この項目は必須です';
    }
    if (formData.publisher.trim() === '') {
      errors.publisher = 'この項目は必須です';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // フォーム送信
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const input: CreateBookInput | UpdateBookInput = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        publicationYear: formData.publicationYear !== '' 
          ? parseInt(formData.publicationYear, 10) 
          : null,
        isbn: formData.isbn.trim(),
        category: formData.category.trim() || null,
        pageCount: formData.pageCount !== ''
          ? parseInt(formData.pageCount, 10)
          : null,
        language: formData.language.trim() || null,
      };

      if (formMode === 'create') {
        await createBook(input as CreateBookInput);
        setAlert({ message: '書籍を登録しました', type: 'success' });
      } else if (editingBook !== null) {
        await updateBook(editingBook.id, input);
        setAlert({ message: '書籍を更新しました', type: 'success' });
      }

      handleCloseForm();
      await fetchBooks();
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { error?: { type?: string; isbn?: string } } };
      if (err.status === 409 && err.data?.error?.type === 'DUPLICATE_ISBN') {
        setFormErrors({ isbn: `ISBN ${err.data.error.isbn ?? ''} は既に登録されています` });
      } else {
        setAlert({ message: '操作に失敗しました', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, formMode, editingBook, validateForm, handleCloseForm, fetchBooks]);

  // 削除確認を開く
  const handleOpenDeleteConfirm = useCallback((book: Book) => {
    setDeleteTarget(book);
  }, []);

  // 削除確認を閉じる
  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // 削除実行
  const handleDelete = useCallback(async () => {
    if (deleteTarget === null) return;

    setDeleting(true);
    try {
      await deleteBook(deleteTarget.id);
      setAlert({ message: '書籍を削除しました', type: 'success' });
      handleCloseDeleteConfirm();
      await fetchBooks();
    } catch {
      setAlert({ message: '削除に失敗しました', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, handleCloseDeleteConfirm, fetchBooks]);

  // アラートを閉じる
  const handleCloseAlert = useCallback(() => {
    setAlert(null);
  }, []);

  // カラム定義
  const columns = createColumns(handleOpenEditForm, handleOpenDeleteConfirm);

  return (
    <div data-testid="books-page" className="books-page">
      <h1>書籍一覧</h1>

      {/* アラート */}
      {alert !== null && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={handleCloseAlert}
          autoHide={5000}
          dismissible
        />
      )}

      {/* アクションバー */}
      <div className="books-page-toolbar">
        <button
          type="button"
          className="books-page-add-button"
          onClick={handleOpenCreateForm}
        >
          書籍を登録
        </button>
      </div>

      {/* 書籍一覧 */}
      <DataTable<Book>
        data={books}
        columns={columns}
        keyField="id"
        loading={loading}
        emptyMessage="書籍がありません"
        ariaLabel="書籍一覧"
      />

      {/* 登録・編集フォーム */}
      {showForm && (
        <div className="books-page-form-overlay" onClick={handleCloseForm}>
          <div
            className="books-page-form-container"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{formMode === 'create' ? '書籍登録' : '書籍編集'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <FormInput
                id="title"
                label="タイトル"
                value={formData.title}
                onChange={handleFormChange('title')}
                required
                error={formErrors.title}
              />
              <FormInput
                id="author"
                label="著者"
                value={formData.author}
                onChange={handleFormChange('author')}
                required
                error={formErrors.author}
              />
              <FormInput
                id="isbn"
                label="ISBN"
                value={formData.isbn}
                onChange={handleFormChange('isbn')}
                required
                error={formErrors.isbn}
              />
              <FormInput
                id="publisher"
                label="出版社"
                value={formData.publisher}
                onChange={handleFormChange('publisher')}
                required
                error={formErrors.publisher}
              />
              <FormInput
                id="publicationYear"
                label="出版年"
                value={formData.publicationYear}
                onChange={handleFormChange('publicationYear')}
                type="number"
              />
              <FormInput
                id="category"
                label="カテゴリ"
                value={formData.category}
                onChange={handleFormChange('category')}
              />
              <FormInput
                id="pageCount"
                label="ページ数"
                value={formData.pageCount}
                onChange={handleFormChange('pageCount')}
                type="number"
              />
              <FormInput
                id="language"
                label="言語"
                value={formData.language}
                onChange={handleFormChange('language')}
              />
              <div className="books-page-form-actions">
                <button
                  type="button"
                  className="books-page-form-cancel-button"
                  onClick={handleCloseForm}
                  disabled={submitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="books-page-form-submit-button"
                  disabled={submitting}
                >
                  {formMode === 'create' ? '登録' : '更新'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="書籍を削除しますか？"
        message={`「${deleteTarget?.title ?? ''}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={handleCloseDeleteConfirm}
      />
    </div>
  );
}
