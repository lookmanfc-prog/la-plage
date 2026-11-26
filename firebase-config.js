/* ==========================================================================
   LA PLAGE · accounts & pre-orders configuration
   ==========================================================================
   FILL IN THE THREE PLACEHOLDERS BELOW. Nothing else in the code needs editing.

   1. FIREBASE_CONFIG: Firebase console → Project settings (gear icon) → General →
      "Your apps" → Web app → "SDK setup and configuration" → Config.
      Copy the values across.

   2. ADMIN_EMAILS: the Gmail address(es) allowed into /admin. Each admin creates
      their login in Firebase console → Authentication → Users → "Add user", using
      that Gmail as the email. They then sign in on the site by typing the Gmail in
      the "Username" field. Write them in lowercase.
      ⚠ The same list must also be pasted into firestore.rules (function isAdmin),
      because the database enforces it, not this file.

   3. Leave SHIPPING_FEE at 0 (free shipping) unless you also change it in firestore.rules.
   ========================================================================== */
window.LAPLAGE_CONFIG = {
  FIREBASE_CONFIG: {
    // TEST SITE: its own Firebase project, so test orders never reach the official store's database
    apiKey: 'AIzaSyCgqIiVDwmWR5ZSPdlipOI28X7JdakIUcc',
    authDomain: 'la-plage-a53db.firebaseapp.com',
    projectId: 'la-plage-a53db',
    storageBucket: 'la-plage-a53db.firebasestorage.app',
    messagingSenderId: '412725896195',
    appId: '1:412725896195:web:0f18234f9eabd84e3ada36',
  },
  ADMIN_EMAILS: [
    'lookmanfc@gmail.com',
    'ryannguyen101209@gmail.com',
    'yosuke6eguchi@gmail.com',
  ],
  SHIPPING_FEE: 0,          // shipping inside Saigon: free (must match firestore.rules)
  SHIPPING_FEE_OTHER: 50000, // shipping anywhere else in Vietnam (must match firestore.rules)
  /* How customers pay (shown after they place an order). Fill in what you use; leave a line empty to say "we will send you the details". */
  PAYMENT: {
    BANK_NAME: 'VietinBank - CN Tan Binh - PGD Bau Cat',
    ACCOUNT_NAME: 'NGUYEN MINH HY',
    ACCOUNT_NO: '105600101209',
    QR_IMAGE: 'assets/pay/qr.png',
    CASH: 'Pay in cash, in person. We will contact you to arrange where and when to meet.',
  },

  /* Email alerts for every new order and contact message (Web3Forms, https://web3forms.com):
     enter your inbox there, they email you an access key, paste it below. Leave as is to switch off. */
  WEB3FORMS_KEY: 'PASTE_',   // TEST SITE: off, so test orders do not email the team

  PREORDER_OPENS: '19 November 2026',
  PREORDER_OPENS_AT: '2026-11-19T00:00:00+07:00',   // until this moment the Pre-order button says "Get notified" and leads to the sign-up (Saigon midnight; also enforced in firestore.rules)


  /* Phone notifications for the admins (free ntfy app, https://ntfy.sh): a push for every new message and new pre-order.
     In the ntfy app tap "+" and subscribe to the TOPIC below. Anyone who knows the topic can read the alerts, so keep it
     long and private (change it to anything unguessable if you like; the app just has to use the same word). */
  NTFY: {
    SERVER: 'https://ntfy.sh',
    TOPIC: '',   // TEST SITE: off, so test orders do not push to the team's phones
  },
};
