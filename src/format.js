export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Value for <input type="datetime-local"> in local time.
export const toLocalInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const STATUS_LABEL = {
  PENDING: 'Waiting for vehicle',
  SCHEDULED: 'Vehicle assigned',
  IN_TRANSIT: 'On the way',
  COMPLETED: 'Collected',
  CANCELLED: 'Cancelled',
};
