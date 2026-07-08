import { useState } from 'react';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { deleteStoryById } from '../lib/deleteStory';

interface DeleteStoryButtonProps {
  storyId: string;
  storyTitle: string;
  onDeleted: () => void;
  className?: string;
  label?: string;
}

export default function DeleteStoryButton({
  storyId,
  storyTitle,
  onDeleted,
  className = 'btn btn-ghost btn-sm btn-danger-outline',
  label = 'Delete',
}: DeleteStoryButtonProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete story?',
      message: `"${storyTitle}" will be permanently deleted, including its cover and inline images. This cannot be undone.`,
      confirmLabel: 'Delete story',
      cancelLabel: 'Keep story',
      variant: 'danger',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteStoryById(storyId);
      toast('Story deleted.', 'success');
      onDeleted();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Delete failed.';
      toast(message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? 'Deleting...' : label}
    </button>
  );
}