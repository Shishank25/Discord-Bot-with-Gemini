class ReminderService {
  constructor() {
    this.reminders = new Map();
    this.reminderIdCounter = 0;
  }

  parseTimeString(timeStr) {
    const match = timeStr.match(/^(\d+)([smh])$/);
    if (!match) {
      throw new Error('Invalid time format. Use: 5s, 10m, 2h');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = { s: 1000, m: 60000, h: 3600000 };
    return value * multipliers[unit];
  }

  setReminder(userId, guildId, channelId, message, timeStr, voiceChannelId = null) {
    const delay = this.parseTimeString(timeStr);
    const reminderId = ++this.reminderIdCounter;

    const timeout = setTimeout(async () => {
      if (this.onReminderTrigger) {
        await this.onReminderTrigger({
          userId,
          guildId,
          channelId,
          message,
          voiceChannelId,
          reminderId,
        });
      }
      this.reminders.delete(reminderId);
    }, delay);

    const reminder = {
      id: reminderId,
      userId,
      guildId,
      channelId,
      message,
      timeStr,
      voiceChannelId,
      timeout,
      createdAt: Date.now(),
      triggerAt: Date.now() + delay,
    };

    this.reminders.set(reminderId, reminder);
    return reminder;
  }

  onTrigger(callback) {
    this.onReminderTrigger = callback;
  }

  getUserReminders(userId) {
    return Array.from(this.reminders.values()).filter(
      r => r.userId === userId
    );
  }
}

export default new ReminderService();