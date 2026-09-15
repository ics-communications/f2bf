/**
 * Registration endpoint for the Fall 2026 Big Read
 * https://f2bf.icscanada.edu/big-read
 *
 * WHAT IT DOES
 *   Receives a POST from the registration form on the Big Read landing page,
 *   appends the registrant to a Google Sheet, emails them a confirmation with
 *   the book excerpt attached, and notifies the staff addresses below.
 *
 * HOW TO DEPLOY
 *   1. Upload Big-Read-Excerpt-F26.pdf to Drive, open it, and copy the file ID
 *      out of the URL (drive.google.com/file/d/<THIS PART>/view).
 *      Set the file's sharing to "Anyone with the link — Viewer".
 *   2. https://script.google.com -> New project. Paste this whole file in,
 *      replacing the default Code.gs contents.
 *   3. Fill in EXCERPT_FILE_ID and SHEET_ID below. Run setup() once and
 *      approve the permission prompt; it creates the response sheet and
 *      prints its ID in View > Logs if you left SHEET_ID blank.
 *   4. Deploy > New deployment > Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      Copy the /exec URL.
 *   5. Paste that URL into big-read/index.html, replacing
 *      PASTE_APPS_SCRIPT_EXEC_URL_HERE.
 *
 * NOTE ON QUOTAS
 *   A consumer Gmail account sends 100 emails/day; a Workspace account 1,500.
 *   A Big Read can outrun the consumer limit. Deploy this from the ICS
 *   Workspace account, not a personal one.
 */

// ── Configure ────────────────────────────────────────────────────────────────

const NOTIFY_EMAILS = ['ics-communications@icscanada.edu', 'haceroferrer@icscanada.edu'];

// Drive file ID of Big-Read-Excerpt-F26.pdf. Required — without it the
// confirmation still sends, but with a download link only and no attachment.
const EXCERPT_FILE_ID = '';

// Leave '' on first run; setup() creates the sheet and logs the ID to paste here.
const SHEET_ID = '';

const SHEET_NAME   = 'Registrations';
const SHEET_TITLE  = 'Big Read Fall 2026 — Defying Tyrants — Registrations';

const EVENT_NAME   = 'Defying Tyrants';
const EVENT_WHEN   = 'Thursday, October 8, 2026 at 7:00 PM ET';
const EVENT_PAGE   = 'https://f2bf.icscanada.edu/big-read';
const LIVESTREAM   = 'https://www.youtube.com/user/christianstudies/live';
const REPLY_TO     = 'info@icscanada.edu';
const SENDER_NAME  = 'Free to be Faithful — Institute for Christian Studies';

const HEADERS = [
  'Timestamp', 'First Name', 'Last Name', 'Email', 'Country',
  'Church / Institution', 'Heard From', 'Consent', 'Excerpt Sent', 'Page URL'
];


// ── Endpoint ─────────────────────────────────────────────────────────────────

/**
 * The form posts JSON as text/plain (a simple request, so the browser skips
 * the CORS preflight that Apps Script cannot answer). The response is opaque
 * to the page either way; the page treats a resolved fetch as success, so
 * every failure path here has to be recoverable from the sheet and the
 * failure notification rather than from the browser.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.email || !data.firstName) {
      throw new Error('Missing required fields: ' + JSON.stringify(data));
    }

    const sheet = getSheet_();
    let excerptSent = 'no';

    try {
      sendConfirmation_(data);
      excerptSent = 'yes';
    } catch (mailErr) {
      // Record the registration regardless; a failed email is recoverable
      // by hand, a lost registration is not.
      excerptSent = 'FAILED: ' + mailErr.message;
      notifyFailure_(data, mailErr);
    }

    sheet.appendRow([
      new Date(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.country || '',
      data.affiliation || '',
      data.heardFrom || '',
      data.consent || '',
      excerptSent,
      data.pageUrl || ''
    ]);

    notifyStaff_(data, sheet.getLastRow() - 1);

    return json_({ ok: true });

  } catch (err) {
    console.error(err);
    try { notifyFailure_({ raw: e && e.postData && e.postData.contents }, err); } catch (ignored) {}
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, endpoint: 'big-read-fall-2026' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── Confirmation email ───────────────────────────────────────────────────────

function sendConfirmation_(data) {
  const name = (data.firstName || '').trim();
  const greeting = name ? 'Hello ' + name + ',' : 'Hello,';

  const excerpt = getExcerpt_();

  const plain =
    greeting + '\n\n' +
    'You are registered for the Fall Big Read: an evening with Matthew D. Taylor on ' +
    EVENT_NAME + ': Following Jesus in a World of Christian Antichrists.\n\n' +
    EVENT_WHEN + '\n' +
    'Watch live: ' + LIVESTREAM + '\n\n' +
    (excerpt
      ? 'An excerpt from the book is attached to this email. The book itself publishes ' +
        'October 6, two days before we meet, so the excerpt is your head start.\n\n'
      : 'An excerpt from the book is on its way separately.\n\n') +
    'You do not need to have finished the book, or started it, to join us. Bring your ' +
    'questions: the live chat is where they go, and we work through as many as the ' +
    'evening allows.\n\n' +
    'We will send a reminder with the link the day before.\n\n' +
    'Event details: ' + EVENT_PAGE + '\n\n' +
    'Free to be Faithful\n' +
    'Institute for Christian Studies\n' +
    '59 St. George Street, Toronto, ON M5S 2E6\n' +
    'info@icscanada.edu | 1-416-979-2331\n\n' +
    'You are receiving this because you registered for this event and consented to ' +
    'hear from us. Reply with "unsubscribe" at any time.';

  const html =
    '<div style="font-family:Georgia,serif;max-width:560px;color:#1A2A33;line-height:1.7;">' +
      '<p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;' +
        'text-transform:uppercase;color:#C83C2C;margin:0 0 6px;">Fall Big Read &middot; 2026</p>' +
      '<h1 style="font-size:30px;line-height:1.1;margin:0 0 6px;color:#1B3A4B;">Defying Tyrants</h1>' +
      '<p style="font-style:italic;color:#3D4F59;margin:0 0 24px;">' +
        'Following Jesus in a World of Christian Antichrists</p>' +

      '<p>' + escapeHtml_(greeting) + '</p>' +
      '<p>You are registered for an evening with <strong>Matthew D. Taylor</strong>.</p>' +

      '<table role="presentation" style="border-collapse:collapse;margin:22px 0;' +
        'font-family:Arial,sans-serif;font-size:15px;">' +
        '<tr><td style="padding:6px 16px 6px 0;color:#7E929E;">When</td>' +
            '<td style="padding:6px 0;"><strong>' + EVENT_WHEN + '</strong></td></tr>' +
        '<tr><td style="padding:6px 16px 6px 0;color:#7E929E;">Where</td>' +
            '<td style="padding:6px 0;"><a href="' + LIVESTREAM + '" style="color:#1B3A4B;">' +
              'Live on YouTube</a></td></tr>' +
        '<tr><td style="padding:6px 16px 6px 0;color:#7E929E;">Cost</td>' +
            '<td style="padding:6px 0;">Free</td></tr>' +
      '</table>' +

      (excerpt
        ? '<p><strong>An excerpt from the book is attached.</strong> ' +
          '<em>Defying Tyrants</em> publishes October 6, two days before we meet, ' +
          'so consider this your head start.</p>'
        : '<p>An excerpt from the book is on its way separately.</p>') +

      '<p>You do not need to have finished the book, or started it, to join us. ' +
        'Bring your questions: the live chat is where they go, and we work through ' +
        'as many as the evening allows.</p>' +

      '<p style="margin:28px 0;">' +
        '<a href="' + EVENT_PAGE + '" style="display:inline-block;background:#C83C2C;' +
          'color:#fff;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;' +
          'letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;' +
          'padding:13px 30px;border-radius:100px;">Event Details</a>' +
      '</p>' +

      '<p style="font-family:Arial,sans-serif;font-size:12px;color:#7E929E;' +
        'border-top:1px solid #D6DDE2;padding-top:18px;margin-top:32px;">' +
        'Free to be Faithful &mdash; Institute for Christian Studies<br>' +
        '59 St. George Street, Toronto, ON M5S 2E6<br>' +
        '<a href="mailto:info@icscanada.edu" style="color:#7E929E;">info@icscanada.edu</a> ' +
        '&middot; 1-416-979-2331<br><br>' +
        'You are receiving this because you registered for this event and consented ' +
        'to hear from us. Reply with &ldquo;unsubscribe&rdquo; at any time.' +
      '</p>' +
    '</div>';

  const options = {
    name: SENDER_NAME,
    replyTo: REPLY_TO,
    htmlBody: html
  };
  if (excerpt) options.attachments = [excerpt];

  MailApp.sendEmail(data.email, 'You are registered — Defying Tyrants Big Read, October 8', plain, options);
}

/** Returns the excerpt as a mail attachment, or null if it is not configured. */
function getExcerpt_() {
  if (!EXCERPT_FILE_ID) return null;
  try {
    return DriveApp.getFileById(EXCERPT_FILE_ID).getBlob()
      .setName('Defying-Tyrants-Excerpt.pdf');
  } catch (err) {
    console.error('Excerpt unavailable: ' + err);
    return null;
  }
}


// ── Staff notifications ──────────────────────────────────────────────────────

function notifyStaff_(data, count) {
  MailApp.sendEmail({
    to: NOTIFY_EMAILS.join(','),
    subject: 'Big Read registration #' + count + ' — ' +
             (data.firstName || '') + ' ' + (data.lastName || ''),
    htmlBody:
      '<p><strong>' + escapeHtml_((data.firstName || '') + ' ' + (data.lastName || '')) +
        '</strong> registered for the Fall Big Read.</p>' +
      '<p>Email: ' + escapeHtml_(data.email || '') + '<br>' +
         'Country: ' + escapeHtml_(data.country || '—') + '<br>' +
         'Church / institution: ' + escapeHtml_(data.affiliation || '—') + '<br>' +
         'Heard from: ' + escapeHtml_(data.heardFrom || '—') + '</p>' +
      '<p>Total registrations: ' + count + '</p>'
  });
}

function notifyFailure_(data, err) {
  MailApp.sendEmail({
    to: NOTIFY_EMAILS.join(','),
    subject: 'ACTION NEEDED — Big Read registration email failed',
    htmlBody:
      '<p>A Big Read registration came in but the confirmation email did not send. ' +
        'The registration is in the sheet; the excerpt needs to go out by hand.</p>' +
      '<p><strong>Error:</strong> ' + escapeHtml_(String(err)) + '</p>' +
      '<pre>' + escapeHtml_(JSON.stringify(data, null, 2)) + '</pre>'
  });
}


// ── Sheet ────────────────────────────────────────────────────────────────────

function getSheet_() {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = createSheet_(ss);
  return sheet;
}

function createSheet_(ss) {
  const sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1B3A4B')
    .setFontColor('#F0EBE3');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(4, 240);
  return sheet;
}

/** Run once from the editor. Creates the sheet if SHEET_ID is blank. */
function setup() {
  let id = SHEET_ID;
  if (!id) {
    const ss = SpreadsheetApp.create(SHEET_TITLE);
    createSheet_(ss);
    const def = ss.getSheetByName('Sheet1');
    if (def) ss.deleteSheet(def);
    id = ss.getId();
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', id);
    Logger.log('Created response sheet. Paste this into SHEET_ID:');
    Logger.log(id);
    Logger.log(ss.getUrl());
  } else {
    getSheet_();
    Logger.log('Sheet ready: ' + SpreadsheetApp.openById(id).getUrl());
  }

  Logger.log(EXCERPT_FILE_ID
    ? 'Excerpt attachment: ' + DriveApp.getFileById(EXCERPT_FILE_ID).getName()
    : 'WARNING: EXCERPT_FILE_ID is blank — confirmations will send without the excerpt.');
}

/** Sends a confirmation to you, so you can read it before anyone else does. */
function testConfirmation() {
  sendConfirmation_({
    firstName: 'Test',
    lastName:  'Registrant',
    email:     Session.getActiveUser().getEmail()
  });
  Logger.log('Test confirmation sent to ' + Session.getActiveUser().getEmail());
}

function escapeHtml_(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
