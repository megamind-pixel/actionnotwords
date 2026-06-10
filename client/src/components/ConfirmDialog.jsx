import { Modal } from './Modal';

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{fontSize:'13.5px',color:'var(--g4)',marginBottom:'22px'}}>{message}</p>
      <div className="flex-center gap-8" style={{justifyContent:'flex-end'}}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}
