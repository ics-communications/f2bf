/**
 * Creates the church capture form behind the primary CTA on
 * https://f2bf.icscanada.edu/churches
 *
 * HOW TO RUN
 *   1. Go to https://script.google.com and create a new project.
 *   2. Paste this whole file in, replacing the default Code.gs contents.
 *   3. Set NOTIFY_EMAILS below.
 *   4. Run createChurchForm(). Approve the permission prompt.
 *   5. Open View > Logs. The published URL is what goes in the CTA button
 *      on churches/index.html; the forms.gle short link is what goes in the
 *      printed letter.
 *
 * Running createChurchForm() a second time creates a SECOND form. To change
 * an existing form, edit the constants and run updateChurchForm() instead.
 */

// Where new-signup notifications go.
const NOTIFY_EMAILS = ['info@icscanada.edu'];

// Optional: paste a Drive folder ID to keep the form and its response sheet
// somewhere other than the root of My Drive. Leave '' to skip.
const DRIVE_FOLDER_ID = '';

const FORM_TITLE = 'Resources for Your Church';
const SHEET_TITLE = 'Church Signups — Responses';

const FORM_DESCRIPTION =
  'The Institute for Christian Studies has walked alongside churches for more ' +
  'than fifty years. Tell us a little about your congregation and we will send ' +
  'you new resources as they are released — research, recorded conversations, ' +
  'and talks, free for your church to use.\n\n' +
  'We send a handful of emails a year. You can unsubscribe at any time.';

const CONFIRMATION_MESSAGE =
  'Thank you — we have you on the list.\n\n' +
  'You will hear from us when new resources for congregations are ready. In the ' +
  'meantime, everything currently available is at f2bf.icscanada.edu/churches.\n\n' +
  'If you would like to talk with someone at ICS directly, write to ' +
  'info@icscanada.edu or call 1-416-979-2331.';

// CASL requires express consent, sender identification, and an unsubscribe
// mechanism at the point of consent. This checkbox is the record of all three,
// which is why it is the one optional-looking field that is required.
const CONSENT_TEXT =
  'Yes, the Institute for Christian Studies may email me about resources, ' +
  'courses, and events. (Unsubscribe at any time. ICS, 59 St. George Street, ' +
  'Toronto, ON M5S 2E6.)';


/**
 * Creates the form, links a response spreadsheet, and installs the
 * notification trigger. This is the function to run.
 */
function createChurchForm() {
  const form = FormApp.create(FORM_TITLE);

  form.setDescription(FORM_DESCRIPTION);
  form.setConfirmationMessage(CONFIRMATION_MESSAGE);

  // Google's built-in email collection requires the respondent to be signed
  // into a Google account, which would turn away a good share of pastors. We
  // ask for the address as an ordinary validated field instead.
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  // Only meaningful on a Workspace account, and it throws on a consumer one.
  // A throw here would strand a half-built form, so it fails quietly.
  try {
    form.setRequireLogin(false);
  } catch (err) {
    Logger.log('Skipped setRequireLogin: %s', err.message);
  }

  form.setProgressBar(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setAcceptingResponses(true);

  buildQuestions_(form);

  const sheet = SpreadsheetApp.create(SHEET_TITLE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  moveToFolder_(form.getId());
  moveToFolder_(sheet.getId());

  installNotificationTrigger_(form);

  PropertiesService.getScriptProperties().setProperties({
    CHURCH_FORM_ID: form.getId(),
    CHURCH_SHEET_ID: sheet.getId(),
  });

  logFormUrls();
}


/**
 * Only four fields are required: name, email, church, and consent. Everything
 * else is optional on purpose — this is a capture form, and each required
 * field costs completions.
 */
function buildQuestions_(form) {
  const emailRule = FormApp.createTextValidation()
    .setHelpText('Please enter a valid email address.')
    .requireTextIsEmail()
    .build();

  form.addTextItem()
    .setTitle('Your name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Email address')
    .setValidation(emailRule)
    .setRequired(true);

  form.addTextItem()
    .setTitle('Church or organization')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Your role there')
    .setChoiceValues([
      'Pastor or minister',
      'Associate or assistant pastor',
      'Elder, deacon, or board member',
      'Staff member',
      'Lay leader or volunteer',
      'Member of the congregation',
    ])
    .showOtherOption(true)
    .setRequired(false);

  form.addTextItem()
    .setTitle('City and province or state')
    .setHelpText('Helps us point you to gatherings and partners near you.')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Denomination or tradition')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Roughly how many people worship with you?')
    .setChoiceValues([
      'Fewer than 50',
      '50 to 150',
      '150 to 400',
      'More than 400',
    ])
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('What would you like to hear about?')
    .setChoiceValues([
      'New resources for congregations as they are released',
      'Free to be Faithful courses for members of our congregation',
      'Events, conferences, and livestreams',
      'Talking with ICS about working together',
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('What is your congregation wrestling with right now?')
    .setHelpText(
      'Optional, and there is no wrong answer. These resources will grow over ' +
      'the coming years, and what you tell us shapes what we make next.')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('Keeping in touch')
    .setChoiceValues([CONSENT_TEXT])
    .setRequired(true);
}


/**
 * Emails NOTIFY_EMAILS whenever someone signs up, so a new church partner
 * conversation does not sit unnoticed in a spreadsheet.
 */
function onChurchFormSubmit(e) {
  if (!e || !e.response) return;

  const answers = e.response.getItemResponses();
  const rows = answers.map(function (item) {
    let value = item.getResponse();
    if (Array.isArray(value)) value = value.join(', ');
    return '<tr>' +
      '<td style="padding:4px 12px 4px 0;vertical-align:top;color:#7E929E;">' +
      escapeHtml_(item.getItem().getTitle()) + '</td>' +
      '<td style="padding:4px 0;vertical-align:top;">' +
      escapeHtml_(String(value)) + '</td>' +
      '</tr>';
  }).join('');

  const body =
    '<p style="font-family:Arial,sans-serif;">' +
    'New signup from the churches page.</p>' +
    '<table style="font-family:Arial,sans-serif;font-size:14px;">' + rows +
    '</table>';

  MailApp.sendEmail({
    to: NOTIFY_EMAILS.join(','),
    subject: 'New church signup — ' + FORM_TITLE,
    htmlBody: body,
  });
}


function installNotificationTrigger_(form) {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'onChurchFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('onChurchFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();
}


function moveToFolder_(fileId) {
  if (!DRIVE_FOLDER_ID) return;
  try {
    DriveApp.getFileById(fileId).moveTo(DriveApp.getFolderById(DRIVE_FOLDER_ID));
  } catch (err) {
    Logger.log('Could not move %s into folder: %s', fileId, err.message);
  }
}


function escapeHtml_(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/**
 * Re-prints the URLs for a form this script already created.
 */
function logFormUrls() {
  const formId = PropertiesService.getScriptProperties().getProperty('CHURCH_FORM_ID');
  if (!formId) {
    Logger.log('No form yet — run createChurchForm() first.');
    return;
  }
  const form = FormApp.openById(formId);
  const published = form.getPublishedUrl();

  Logger.log('Published URL (use in the CTA button): %s', published);
  Logger.log('Short URL (use in the printed letter):  %s', form.shortenFormUrl(published));
  Logger.log('Edit URL:                               %s', form.getEditUrl());
  Logger.log('Responses sheet:                        %s',
    PropertiesService.getScriptProperties().getProperty('CHURCH_SHEET_ID'));
}


/**
 * Rewrites the wording on an existing form without changing its URL. Use this
 * rather than re-running createChurchForm(), which would mint a second form
 * and orphan any URL already in print.
 */
function updateChurchForm() {
  const formId = PropertiesService.getScriptProperties().getProperty('CHURCH_FORM_ID');
  if (!formId) {
    Logger.log('No form yet — run createChurchForm() first.');
    return;
  }
  const form = FormApp.openById(formId);
  form.setTitle(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION);
  form.setConfirmationMessage(CONFIRMATION_MESSAGE);
  Logger.log('Updated title, description, and confirmation message.');
}
