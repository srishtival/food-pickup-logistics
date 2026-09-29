import { STATUS_LABEL } from '../format.js';

export default function StatusChip({ status }) {
  return <span className={`chip chip-${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
}
