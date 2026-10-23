import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import EntityImage from '../../components/EntityImage';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { entityCode, formatDate } from '../../utils/format';

type ResourceKind = 'dishes' | 'chefs' | 'ingredients';

interface ResourceConfig {
  kindLabel: string;
  listPath: string;
  entityKey: 'dish' | 'chef' | 'ingredient';
  successNotice: string;
  blockPrefix: string;
}

const CONFIGS: Record<ResourceKind, ResourceConfig> = {
  dishes: {
    kindLabel: 'Món Ăn',
    listPath: '/admin/dishes',
    entityKey: 'dish',
    successNotice: 'Đã xóa món ăn khỏi hệ thống thành công!',
    blockPrefix: 'Không thể xóa món ăn',
  },
  chefs: {
    kindLabel: 'Đầu Bếp',
    listPath: '/admin/chefs',
    entityKey: 'chef',
    successNotice: 'Đã xóa đầu bếp khỏi hệ thống thành công!',
    blockPrefix: 'Không thể xóa đầu bếp',
  },
  ingredients: {
    kindLabel: 'Nguyên Liệu',
    listPath: '/admin/ingredients',
    entityKey: 'ingredient',
    successNotice: 'Đã xóa nguyên liệu khỏi hệ thống thành công!',
    blockPrefix: 'Không thể xóa nguyên liệu',
  },
};

interface RecordShape {
  id: number;
  name: string;
  imagePath: string | null;
  updatedAt: string;
}

// Trang xác nhận xóa: chỉ gửi DELETE khi bấm "Xác Nhận Xóa".
// Mở/reload trang hay bấm Hủy/Esc đều không thay đổi dữ liệu.
export default function DeleteConfirmPage({ resource }: { resource: ResourceKind }) {
  const config = CONFIGS[resource];
  const { id } = useParams<{ id: string }>();
  const recordId = id ? Number(id) : null;
  const validId = recordId !== null && Number.isInteger(recordId) && recordId > 0;
  const navigate = useNavigate();

  const detail = useFetch<RecordShape>(
    () => api[resource].detail(recordId as number),
    [resource, recordId]
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(config.listPath);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, config.listPath]);

  const cancel = () => navigate(config.listPath);

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await api[resource].remove(recordId as number);
      navigate(config.listPath, { state: { notice: { type: 'success', text: config.successNotice } } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      navigate(config.listPath, { state: { notice: { type: 'error', text: `${config.blockPrefix}: ${message}` } } });
    }
  };

  if (!validId) {
    return <NotFoundPanel title={`Không Tìm Thấy ${config.kindLabel}`} />;
  }
  if (detail.state.status === 'loading') {
    return <LoadingBlock label={`Đang tải dữ liệu ${config.kindLabel.toLowerCase()}...`} />;
  }
  if (detail.state.status === 'error') {
    if (detail.state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title={`Không Tìm Thấy ${config.kindLabel}`} />;
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ErrorPanel message={detail.state.message} onRetry={detail.retry} />
      </div>
    );
  }

  const record = detail.state.data;

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="fixed inset-0 z-40 bg-charcoal/40" onClick={cancel} aria-hidden />
      <div className="relative z-50 rounded-2xl border border-sand bg-ivory p-6 shadow-lg sm:p-8">
        <h1 className="font-serif text-2xl font-bold text-charcoal">Xác Nhận Xóa {config.kindLabel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal">
          Bạn có chắc chắn muốn xóa {config.kindLabel.toLowerCase()} &quot;{record.name}&quot; khỏi hệ thống không? Hành
          động này sẽ xóa dữ liệu vĩnh viễn và không thể hoàn tác.
        </p>

        <div className="mt-5 flex items-center gap-4 rounded-xl border border-sand bg-cream p-3">
          <div className="w-20 shrink-0">
            <EntityImage src={record.imagePath} alt={record.name} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif font-bold text-charcoal">{record.name}</p>
            <p className="mt-1 text-xs text-muted">
              {entityCode(config.entityKey, record.id)}
              {record.updatedAt ? ` · Cập nhật ${formatDate(record.updatedAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={cancel}
            className="rounded-xl border border-sand-dark bg-ivory px-6 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-xl bg-terracotta px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirming ? 'Đang xóa...' : 'Xác Nhận Xóa'}
          </button>
        </div>
      </div>
    </section>
  );
}
