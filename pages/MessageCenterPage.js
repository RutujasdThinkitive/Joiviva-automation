const { BasePage } = require('./BasePage');

/**
 * MessageCenterPage - Page object for Communications > Messages module.
 * Covers: Inbox, Compose, Thread view, Sidebar navigation, Shared Inbox, Groups,
 * Archive, Bin, Bookmarks, Sent, and action menus.
 *
 * Route: /provider/communications/messages
 */
class MessageCenterPage extends BasePage {
  constructor(page) {
    super(page);

    // ─── TOP NAV ──────────────────────────────────────────────────────────────
    this.navCommunications = page.locator('a:has-text("Communications")');

    // ─── TABS (Inbox / Shared Inbox / Groups) ─────────────────────────────────
    this.tabInbox = page.getByRole('tab', { name: /inbox/i }).first();
    this.tabSharedInbox = page.getByRole('tab', { name: /shared inbox/i });
    this.tabGroups = page.getByRole('tab', { name: /groups/i });

    // ─── SIDEBAR NAVIGATION ITEMS ─────────────────────────────────────────────
    this.sidebarInbox = page.locator('text=Inbox').first();
    this.sidebarMessages = page.locator('text=Messages').first();
    this.sidebarDocuments = page.locator('text=Documents').first();
    this.sidebarSent = page.locator('text=Sent').first();
    this.sidebarBookmarks = page.locator('text=Bookmarks').first();
    this.sidebarArchive = page.locator('text=Archive').first();
    this.sidebarBin = page.locator('text=Bin').first();

    // ─── MESSAGE LIST AREA ────────────────────────────────────────────────────
    this.newMessageButton = page.getByRole('button', { name: /new message|compose/i });
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
    this.messageListContainer = page.locator('[class*="messagesListContainer"], [class*="messagesList"]').first();
    this.messageRows = page.locator('[class*="messageRow"], [class*="threadRow"], [class*="listItem"], [class*="MuiListItem"], [class*="MessageItem"], [class*="message-item"]');
    this.loadingSpinner = page.locator('[class*="CircularProgress"], [role="progressbar"]').first();
    this.emptyState = page.locator('text=/no messages|no threads|no results/i').first();

    // ─── MESSAGE DETAIL / DESCRIPTION ─────────────────────────────────────────
    this.messageDetailContainer = page.locator('[class*="messageDescription"], [class*="messageDetail"]').first();
    this.messageSubject = page.locator('[class*="subject"], h4, h5, h6').first();
    this.messageBody = page.locator('[class*="messageBody"], [class*="content"]').first();
    this.senderName = page.locator('[class*="senderName"]').first();
    this.priorityChip = page.locator('[class*="MuiChip"]').first();

    // ─── MESSAGE DETAIL ACTION BUTTONS ────────────────────────────────────────
    this.replyButton = page.locator('img[src*="ArrowBendUpLeft"], button:has-text("Reply")').first();
    this.replyAllButton = page.locator('img[src*="ArrowBendDoubleUpLeft"], button:has-text("Reply All")').first();
    this.forwardButton = page.locator('img[src*="ArrowBendUpRight"], button:has-text("Forward")').first();
    this.bookmarkButton = page.locator('[aria-label*="bookmark" i], [class*="Star"]').first();
    this.deleteButton = page.locator('[aria-label*="delete" i], [class*="Trash"]').first();
    this.archiveButton = page.locator('[aria-label*="archive" i], [class*="Archive"]').first();
    this.markUnreadButton = page.locator('[aria-label*="unread" i], img[src*="mark_email_unread"]').first();
    this.printButton = page.locator('img[src*="Printer"]').first();

    // ─── PATIENT CONTEXT PANEL (in message detail) ────────────────────────────
    this.patientPanel = page.locator('[class*="patientOverview"], [class*="patientPanel"]').first();
    this.patientName = page.locator('[class*="patientName"]').first();
    this.patientDob = page.locator('text=/DOB|Date of Birth/i').first();
    this.patientPhone = page.locator('[class*="patientPhone"]').first();

    // ─── COMPOSE DRAWER ───────────────────────────────────────────────────────
    this.composeDrawer = page.locator('[class*="MuiDrawer"]').first();
    this.composeTitle = page.locator('text=/compose new message|reply|forward/i').first();
    this.toField = page.locator('label:has-text("To")').locator('..').locator('input').first();
    this.ccField = page.locator('label:has-text("CC")').locator('..').locator('input').first();
    this.patientField = page.locator('label:has-text("Patient")').locator('..').locator('input').first();
    this.messageTypeDropdown = page.locator('label:has-text("Message Type")').locator('..').first();
    this.priorityDropdown = page.locator('label:has-text("Priority")').locator('..').first();
    this.subjectInput = page.locator('input[placeholder="Enter Subject"], [name="subject"]').first();
    this.messageInput = page.locator('[placeholder="Type your Message"], [name="message"], .ql-editor').first();
    this.saveToChartCheckbox = page.locator('label:has-text("Save to Chart")').first();
    this.disableRepliesCheckbox = page.locator('label:has-text("Disable further replies"), text=/disable further replies/i').first();
    this.sendButton = page.getByRole('button', { name: /send/i }).first();
    this.closeComposeButton = page.locator('[class*="MuiDrawer"] button:has([class*="CloseIcon"]), [aria-label="close"]').first();
    this.attachButton = page.locator('[class*="AttachFile"], button:has-text("Attach")').first();

    // ─── COMPOSE — TASK SECTION ───────────────────────────────────────────────
    this.addTaskButton = page.getByRole('button', { name: /add task|new task/i }).first();
    this.taskTypeDropdown = page.locator('label:has-text("Task Type")').locator('..').first();
    this.assignToField = page.locator('label:has-text("Assign To"), label:has-text("Assign to")').locator('..').locator('input').first();
    this.taskTitleInput = page.locator('label:has-text("Task Title"), [name="taskTitle"]').locator('..').locator('input').first();
    this.dueDatePicker = page.locator('label:has-text("Due Date")').locator('..').first();
    this.saveTaskButton = page.getByRole('button', { name: /save task/i }).first();

    // ─── SHARED INBOX ─────────────────────────────────────────────────────────
    this.sharedInboxUserDropdown = page.locator('label:has-text("User")').locator('..').locator('input').first();
    this.manageSharedInboxesButton = page.getByRole('button', { name: /manage shared inboxes/i });

    // ─── GROUPS ───────────────────────────────────────────────────────────────
    this.createGroupButton = page.getByRole('button', { name: /create new group/i });
    this.groupNameInput = page.locator('[name="name"], input[placeholder*="group name" i]').first();
    this.viewGroupDetailsIcon = page.locator('[aria-label="View group details"]');
    this.editGroupIcon = page.locator('[aria-label="Edit group"]');
    this.addParticipantsIcon = page.locator('[aria-label="Add participants"]');

    // ─── TOAST / SNACKBAR ─────────────────────────────────────────────────────
    this.snackbar = page.locator('[class*="MuiSnackbar"], [class*="Snackbar"], [role="alert"]').first();

    // ─── BREADCRUMB ───────────────────────────────────────────────────────────
    this.breadcrumb = page.locator('[class*="breadcrumb"], nav[aria-label="breadcrumb"]').first();
  }

  // ─── NAVIGATION METHODS ───────────────────────────────────────────────────

  /** Navigate to Communications > Messages */
  async navigateToMessages() {
    await this.navCommunications.click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /** Navigate directly via URL */
  async gotoMessages() {
    await this.page.goto(
      (process.env.BASE_URL || 'https://portal.qa.joiviva.org') +
        '/provider/communications/messages/inbox'
    );
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  // ─── TAB METHODS ──────────────────────────────────────────────────────────

  async switchToInboxTab() {
    await this.tabInbox.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToSharedInboxTab() {
    await this.tabSharedInbox.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToGroupsTab() {
    await this.tabGroups.click();
    await this.page.waitForTimeout(1000);
  }

  // ─── SIDEBAR METHODS ─────────────────────────────────────────────────────

  async clickSidebarItem(item) {
    const map = {
      inbox: this.sidebarInbox,
      messages: this.sidebarMessages,
      documents: this.sidebarDocuments,
      sent: this.sidebarSent,
      bookmarks: this.sidebarBookmarks,
      archive: this.sidebarArchive,
      bin: this.sidebarBin,
    };
    const locator = map[item.toLowerCase()];
    if (locator) {
      await locator.click();
      await this.page.waitForTimeout(1500);
    }
  }

  // ─── MESSAGE LIST METHODS ────────────────────────────────────────────────

  /** Get count of visible message rows */
  async getMessageCount() {
    await this.page.waitForTimeout(1500);
    return await this.messageRows.count();
  }

  /** Click on a message row by index (0-based) */
  async openMessageByIndex(index = 0) {
    const row = this.messageRows.nth(index);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.click();
    await this.page.waitForTimeout(2000);
  }

  /** Click on a message row that contains specific text */
  async openMessageByText(text) {
    const row = this.page.locator(`[class*="messageRow"]:has-text("${text}"), [class*="threadRow"]:has-text("${text}")`).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.click();
    await this.page.waitForTimeout(2000);
  }

  /** Search for messages */
  async searchMessages(query) {
    await this.searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.searchInput.fill('');
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(2000);
  }

  /** Clear search */
  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(1500);
  }

  // ─── COMPOSE METHODS ─────────────────────────────────────────────────────

  /** Open compose new message drawer */
  async openCompose() {
    await this.newMessageButton.click();
    await this.composeDrawer.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);
  }

  /** Close compose drawer */
  async closeCompose() {
    await this.closeComposeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the To field by searching and selecting a recipient
   * @param {string} name - Recipient name to search
   */
  async selectRecipient(name) {
    const toInput = this.page.locator('[placeholder="Search and Select Clinician/Staff/Patient"]').first();
    await toInput.waitFor({ state: 'visible', timeout: 5000 });
    await toInput.fill(name);
    await this.page.waitForTimeout(2000);
    const option = this.page.getByRole('option', { name: new RegExp(name, 'i') }).first()
      .or(this.page.locator(`li:has-text("${name}")`).first())
      .or(this.page.locator(`[class*="option"]:has-text("${name}")`).first());
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(500);
    // Click away to close the autocomplete dropdown
    await this.page.locator('text=/compose new message/i').first().click().catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the CC field
   * @param {string} name - CC recipient name
   */
  async selectCcRecipient(name) {
    const ccInput = this.page.locator('[placeholder="Search and Select Clinician/Staff/Patient"]').nth(1);
    await ccInput.fill(name);
    await this.page.waitForTimeout(1500);
    const option = this.page.getByRole('option', { name: new RegExp(name, 'i') }).first()
      .or(this.page.locator(`li:has-text("${name}")`).first());
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select a patient in compose form
   * @param {string} name - Patient name
   */
  async selectPatient(name) {
    const patientInput = this.page.locator('[placeholder="Search and Select Patient"]').first();
    await patientInput.fill(name);
    await this.page.waitForTimeout(1500);
    const option = this.page.getByRole('option', { name: new RegExp(name, 'i') }).first()
      .or(this.page.locator(`li:has-text("${name}")`).first());
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select message type from dropdown
   * @param {'Message'|'Documents'} type
   */
  async selectMessageType(type) {
    await this.messageTypeDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: type }).first()
      .or(this.page.locator(`li:has-text("${type}")`).first())
      .click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select priority from dropdown
   * @param {'Low'|'Medium'|'Urgent'} priority
   */
  async selectPriority(priority) {
    await this.priorityDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: new RegExp(priority, 'i') }).first()
      .or(this.page.locator(`li:has-text("${priority}")`).first())
      .click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill subject field
   * @param {string} subject
   */
  async fillSubject(subject) {
    await this.subjectInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.subjectInput.fill(subject);
  }

  /**
   * Fill message body (supports Quill rich text editor)
   * @param {string} message
   */
  async fillMessage(message) {
    const quillEditor = this.page.locator('.ql-editor').first();
    const plainInput = this.page.locator('[placeholder="Type your Message"]').first();

    if (await quillEditor.isVisible().catch(() => false)) {
      await quillEditor.click();
      await quillEditor.fill(message);
    } else {
      await plainInput.fill(message);
    }
  }

  /**
   * Toggle "Save to Chart" checkbox
   */
  async toggleSaveToChart() {
    await this.saveToChartCheckbox.click();
  }

  /**
   * Toggle "Disable further replies" checkbox
   */
  async toggleDisableReplies() {
    await this.disableRepliesCheckbox.click();
  }

  /** Click send button */
  async clickSend() {
    await this.sendButton.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Compose and send a complete message
   * @param {object} opts
   * @param {string} opts.to - Recipient name
   * @param {string} [opts.cc] - CC recipient name
   * @param {string} [opts.patient] - Patient name
   * @param {string} opts.messageType - 'Message' or 'Documents'
   * @param {string} opts.priority - 'Low', 'Medium', or 'Urgent'
   * @param {string} opts.subject - Subject line
   * @param {string} opts.message - Message body
   * @param {boolean} [opts.saveToChart] - Check save to chart
   * @param {boolean} [opts.disableReplies] - Check disable further replies
   */
  async composeAndSend(opts) {
    await this.openCompose();
    await this.selectRecipient(opts.to);

    if (opts.cc) {
      await this.selectCcRecipient(opts.cc);
    }

    if (opts.patient) {
      await this.selectPatient(opts.patient);
    }

    await this.selectMessageType(opts.messageType || 'Message');
    await this.selectPriority(opts.priority || 'Medium');
    await this.fillSubject(opts.subject);
    await this.fillMessage(opts.message);

    if (opts.saveToChart) {
      await this.toggleSaveToChart();
    }

    if (opts.disableReplies) {
      await this.toggleDisableReplies();
    }

    await this.clickSend();
  }

  // ─── THREAD ACTION METHODS ──────────────────────────────────────────────

  async clickReply() {
    await this.replyButton.click();
    await this.composeDrawer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async clickReplyAll() {
    await this.replyAllButton.click();
    await this.composeDrawer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async clickForward() {
    await this.forwardButton.click();
    await this.composeDrawer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async clickBookmark() {
    await this.bookmarkButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickDelete() {
    await this.deleteButton.click();
    await this.page.waitForTimeout(1500);
  }

  async clickArchive() {
    await this.archiveButton.click();
    await this.page.waitForTimeout(1500);
  }

  async clickMarkUnread() {
    await this.markUnreadButton.click();
    await this.page.waitForTimeout(1000);
  }

  // ─── GROUPS METHODS ─────────────────────────────────────────────────────

  /** Create a new group */
  async createGroup(name, memberNames = []) {
    await this.createGroupButton.click();
    await this.page.waitForTimeout(1000);

    const nameInput = this.page.locator('[name="name"], input[placeholder*="name" i]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(name);

    for (const member of memberNames) {
      const memberInput = this.page.locator('[placeholder*="Search" i], [placeholder*="member" i]').first();
      await memberInput.fill(member);
      await this.page.waitForTimeout(1500);
      const option = this.page.locator(`li:has-text("${member}")`).first()
        .or(this.page.getByRole('option', { name: new RegExp(member, 'i') }).first());
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        await this.page.waitForTimeout(500);
      }
    }

    await this.page.getByRole('button', { name: /create|save/i }).last().click();
    await this.page.waitForTimeout(2000);
  }

  // ─── SHARED INBOX METHODS ──────────────────────────────────────────────

  /** Select a user from shared inbox dropdown */
  async selectSharedInboxUser(name) {
    await this.sharedInboxUserDropdown.fill(name);
    await this.page.waitForTimeout(1500);
    const option = this.page.locator(`li:has-text("${name}")`).first()
      .or(this.page.getByRole('option', { name: new RegExp(name, 'i') }).first());
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(1500);
  }

  // ─── HELPER / ASSERTION METHODS ─────────────────────────────────────────

  /** Get snackbar/toast message text */
  async getSnackbarText(timeout = 8000) {
    try {
      await this.snackbar.waitFor({ state: 'visible', timeout });
      return await this.snackbar.textContent();
    } catch {
      return null;
    }
  }

  /** Check if compose drawer is visible */
  async isComposeDrawerVisible() {
    return await this.composeDrawer.isVisible().catch(() => false);
  }

  /** Get all visible thread subjects/preview text */
  async getVisibleThreadTexts() {
    const count = await this.messageRows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await this.messageRows.nth(i).textContent();
      texts.push(text);
    }
    return texts;
  }

  /** Check if a message/thread with specific text exists in the list */
  async hasMessageWithText(text) {
    const count = await this.messageRows.count();
    for (let i = 0; i < count; i++) {
      const content = await this.messageRows.nth(i).textContent();
      if (content && content.includes(text)) return true;
    }
    return false;
  }

  /** Get validation error messages */
  async getValidationErrors() {
    const errors = this.page.locator('[class*="error"], [class*="Mui-error"], p[class*="helper"]');
    const count = await errors.count();
    const messages = [];
    for (let i = 0; i < count; i++) {
      const text = await errors.nth(i).textContent();
      if (text && text.trim()) messages.push(text.trim());
    }
    return messages;
  }

  /** Wait for messages to load (spinner gone) */
  async waitForMessagesLoaded() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  /** Get the current URL path */
  async getCurrentPath() {
    return new URL(this.page.url()).pathname;
  }
}

module.exports = { MessageCenterPage };
