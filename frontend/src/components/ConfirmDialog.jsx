import { useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [working, setWorking] = useState(false);

  const confirm = async () => {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal title={title} onClose={working ? () => {} : onClose} size="sm">
      <div className="confirm">
        <span className="confirm-icon"><Trash2 size={22} /></span>
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={working}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={working}>
          {working && <LoaderCircle className="spin" size={18} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
