# LA PLAGE · accounts, pre-orders and admin: setup

Until these steps are done the site behaves exactly as before: "Sign in" leads to a
"opening soon" page and the product view's "Pre-order" button leads to Private access.

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project** (any name, e.g. `la-plage`). Google Analytics is not needed.
2. In the project: **Build → Authentication → Get started → Sign-in method → Email/Password → Enable** (leave "Email link" off). Save.
3. **Authentication → Settings → Authorized domains**: make sure these are listed (add any that are missing):
   `la-plage-eight.vercel.app`, `localhost`, and any custom domain you use later.
4. **Build → Firestore Database → Create database** → choose a location close to Vietnam (e.g. `asia-southeast1`) → start in **production mode**.

## 2. Create your admin login (do this before going live)
**Authentication → Users → Add user**: email = your admin Gmail, password = a strong password.
You sign in to `/admin` by typing this Gmail in the "Admin Gmail" field.
Doing this first also reserves that address so nobody else can register it.

## 3. Fill in `firebase-config.js`
**Project settings (gear) → General → Your apps → Web (`</>`) → Register app** (no hosting needed).
Copy `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
into `FIREBASE_CONFIG`, and your admin Gmail into `ADMIN_EMAILS` (lowercase).

## 4. Publish the security rules
Open `firestore.rules`, replace `PASTE_ADMIN_GMAIL@gmail.com` with the same admin Gmail (lowercase),
then paste the whole file into **Firestore Database → Rules → Publish**.
These rules are what actually protect customer data; the admin list in `firebase-config.js` only decides what the pages show.

## 5. Deploy and test
Commit and push (Vercel deploys). Then:
1. Open the site → **Sign in** → **Create account** → place a test pre-order from any product.
2. Open `/account` and check it is listed with the 30.000 ₫ shipping line.
3. Open `/admin`, sign in with the admin Gmail, change the order's status, export CSV.

## Good to know
- Customers sign in with a **username**. Firebase stores it as a private address `username@members.laplage.app`
  (never shown, never emailed). There is no self-service "forgot password": reset it for them in
  **Authentication → Users → ⋮ → Reset password** isn't available for these addresses, so instead
  delete the user there and ask them to create a new account, or set a new password with the Firebase Admin SDK.
- The **Gmail** customers enter is saved for notifications only. Nothing sends email yet; that needs an email service (e.g. EmailJS or Firebase's paid plan) added later.
- **Disable** an account in /admin to stop new pre-orders. **Delete** removes the account record (their pre-orders stay); their username login still exists in Authentication until you delete it there too.
- Prices are read from `data/products.json` in the browser. The rules check the 30.000 ₫ shipping and that total = subtotal + shipping, but cannot check each price, so glance at totals before confirming payment.
