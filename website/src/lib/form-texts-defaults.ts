/**
 * Wording of the site's forms and messages (CMS: Website → Forms & messages). One spec drives the CMS fields
 * and the built-in defaults; empty CMS field = built-in text. Placeholders in {braces} are filled in by the app.
 * Server-side validation messages of the APIs stay in code on purpose.
 */
export const FORM_TEXT_GROUPS = [
  {
    key: 'registration',
    tab: 'AURIX registration form',
    fields: [
      ['step1', 'Step 1 title', '1. Competition & team'],
      ['competition', 'Label: competition', 'Competition'],
      ['membersWord', 'Word after the team size in the list', 'members'],
      ['teamName', 'Label: team name', 'Team name'],
      ['step2', 'Step 2 title', '2. Team members'],
      ['minNote', 'Minimum note ({min})', '(min {min})'],
      ['idHelp', 'ID upload help', 'Every member must upload a clear photo or PDF of their student ID card (max 2 MB; photos are resized automatically).'],
      ['leader', 'First member label', 'Team leader'],
      ['member', 'Other members ({n})', 'Member {n}'],
      ['remove', 'Remove member', 'Remove'],
      ['fullName', 'Placeholder: name', 'Full name'],
      ['email', 'Placeholder: leader email', 'Email'],
      ['emailOptional', 'Placeholder: member email', 'Email (optional)'],
      ['phone', 'Placeholder: leader phone', 'Phone'],
      ['phoneOptional', 'Placeholder: member phone', 'Phone (optional)'],
      ['college', 'Placeholder: college', 'University / college'],
      ['studentId', 'ID upload button', 'Student ID'],
      ['noFile', 'No file chosen', 'No file chosen'],
      ['addMember', 'Add member', 'Add member'],
      ['step3', 'Step 3 title', '3. Declaration'],
      ['declaration', 'Declaration text', 'I confirm the details above are correct, all members are currently enrolled students, and we agree to the competition rules. I understand our student ID cards are collected only to verify eligibility, are visible only to the organizers, and will be deleted one month after the event.'],
      ['submit', 'Submit button', 'Register & continue to payment'],
      ['submitting', 'Submit button while sending', 'Submitting…'],
      ['errChoose', 'Error: no competition', 'Please choose a competition.'],
      ['errMembers', 'Error: team size ({count})', 'This competition needs {count} team members.'],
      ['errCollege', 'Error: college missing', 'Please enter the university / college for every team member.'],
      ['errId', 'Error: ID missing', 'Please upload a student ID card for every team member.'],
      ['errConsent', 'Error: declaration', 'Please accept the declaration to continue.'],
      ['errFileSize', 'Error: file too big ({name})', 'The ID file for {name} is larger than 2 MB. Please use a smaller photo.'],
      ['errFailed', 'Error: generic', 'Registration failed. Please try again.'],
      ['doneTitle', 'Success: title', 'Registration received'],
      ['doneCode', 'Success: code label', 'Your registration code'],
      ['doneSave', 'Success: save-code text', 'Save this code. Check your status anytime at'],
      ['doneNext', 'Success: next step', 'Next step: pay the registration fee'],
      ['doneAmount', 'Success: amount label', 'Amount:'],
      ['doneAmountUnknown', 'Success: amount unknown', 'as shown on the payment page'],
      ['donePerTeam', 'Success: after the amount', 'per team.'],
      ['donePrefilled', 'Success: pre-filled note', 'Your details are pre-filled on the payment page. Please keep the same email and phone so we can match your payment.'],
      ['doneConfirm', 'Success: confirmation note', 'Your registration is confirmed only after your payment and student IDs are verified. You will receive an email once it is confirmed.'],
      ['donePay', 'Success: payment button', 'Proceed to payment'],
    ],
  },
  {
    key: 'status',
    tab: 'Registration status lookup',
    fields: [
      ['code', 'Label: code', 'Registration code'],
      ['email', 'Label: email', 'Team leader email'],
      ['check', 'Button', 'Check status'],
      ['perTeam', 'After the amount', '/ team'],
      ['rowRegistration', 'Row: registration', 'Registration'],
      ['rowPayment', 'Row: payment', 'Payment'],
      ['rowIds', 'Row: student IDs', 'Student IDs'],
      ['unknown', 'Unknown state', 'Unknown'],
      ['regPending', 'Registration: pending', 'Pending verification'],
      ['regConfirmed', 'Registration: confirmed', 'Confirmed'],
      ['regRejected', 'Registration: rejected', 'Rejected — please contact the organizers'],
      ['regCancelled', 'Registration: cancelled', 'Cancelled'],
      ['payAwaiting', 'Payment: awaiting', 'Not yet verified (payments are checked once a day)'],
      ['payVerified', 'Payment: verified', 'Payment verified'],
      ['payNotFound', 'Payment: not found', 'Payment not found — please contact the organizers'],
      ['payRefunded', 'Payment: refunded', 'Refunded'],
      ['idPending', 'IDs: pending', 'Being checked'],
      ['idApproved', 'IDs: approved', 'Approved'],
      ['idRejected', 'IDs: rejected', 'Rejected — please contact the organizers'],
    ],
  },
  {
    key: 'notFound',
    tab: '404 page',
    fields: [
      ['eyebrow', 'Small line', 'Error 404 // Trajectory Deviation'],
      ['title', 'Title', 'Coordinates Not Found'],
      ['text', 'Text', 'The requested subsystem or page is not available. Please verify the URL or return to the main navigation telemetry.'],
      ['homeButton', 'Button: home', 'Return to KRS Home'],
      ['aurixButton', 'Button: AURIX', 'Explore AURIX Arena'],
    ],
  },
] as const

type Group = (typeof FORM_TEXT_GROUPS)[number]
export type FormTexts = { [G in Group as G['key']]: Record<G['fields'][number][0], string> }

export const DEFAULT_FORM_TEXTS = Object.fromEntries(
  FORM_TEXT_GROUPS.map((g) => [g.key, Object.fromEntries(g.fields.map(([k, , d]) => [k, d]))]),
) as FormTexts

/** "{n}" style placeholders */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
