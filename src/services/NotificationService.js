// External service stand-in: SMS / Email / Push.
// Messages are written to a log so the console can show what would be sent.
export class NotificationService {
  constructor(repository) {
    this.repo = repository;
  }

  send(channel, to, message) {
    return this.repo.save({ id: null, channel, to, message, at: new Date().toISOString() });
  }

  recent(limit = 8) {
    return this.repo.findAll().sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }
}
