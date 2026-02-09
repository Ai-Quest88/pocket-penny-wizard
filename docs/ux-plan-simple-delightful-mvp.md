# UX Plan: Simple, Delightful MVP for Laymen

**Goal:** Make Finsight a delight to use with a clear, simple purpose and zero complexity for everyday users. MVP = manual transaction upload only (no bank feeds yet); validate how it feels once data is in.

**Design principles:**
- One clear purpose per screen
- One primary action per screen (everything else secondary or hidden)
- Plain language only (no "Entities," "Liabilities," "Net Worth" without explanation)
- Celebrate progress; never punish or overwhelm
- Mobile-friendly and accessible

---

## 1. Product promise (one line)

**"See where your money goes. Upload your transactions, we sort them—you get a clear picture."**

No mention of entities, households, or advanced features in the main narrative.

---

## 2. User journey (layman path only)

```
Sign up / Log in
    → Dashboard (home)
        → If no data: "Add your first transactions" (one button)
        → If has data: "Your money this week" + net worth + recent list
    → Add transactions (upload file or paste)
        → Review & save
        → Success: "X transactions added. View list."
    → Transactions list (search, filter, fix categories)
    → Reports (optional): "Spending by category," "Income vs expenses"
```

**Deferred / secondary:** Entities, Households, Assets, Liabilities, Budgets, AI CFO, Analytics. Available in Settings or "More" but not in the main path.

---

## 3. Screen-by-screen detail

### 3.1 Login / Sign up

- **Keep:** Email + password, Google sign-in, toggle Sign up / Log in.
- **Copy:** "Welcome back" / "Create your account" – one line. No long tagline.
- **Remove:** Any mention of "financial overview" or feature list on this screen.

### 3.2 Dashboard – empty state (no transactions yet)

**Purpose:** Answer "What do I do first?" in 5 seconds.

**Layout:**
- App bar: Logo, user menu (no extra nav in bar).
- Main content:
  - **Headline:** "Your money at a glance"
  - **Subtext:** "Add your first transactions to see spending and trends."
  - **Single primary button:** "Add transactions" (opens upload flow).
  - **Optional secondary link:** "Add one transaction by hand" (small text link).
- No entity filter, no currency selector, no tabs on empty state. Keep the page minimal.

**Copy:**
- Headline: "Your money at a glance"
- Subtext: "Add your first transactions to see where your money goes."
- Button: "Add transactions"

### 3.3 Dashboard – with data

**Purpose:** One-screen snapshot: "How am I doing?"

**Layout:**
- Same app bar.
- **Top card – "This week":**
  - "You spent $X" (or "No spending recorded this week" if none).
  - If budgets exist: "On track" or "Over by $X" with soft color (green / amber).
  - Single line; no extra actions.
- **Net worth (or "Balance snapshot"):**
  - One number: "Net worth: $X" or "Total: $X" with optional short trend ("up 2% from last month").
- **Recent activity:**
  - "Recent transactions" – last 5–10, with description, amount, category. "View all" links to Transactions.
- **Optional tabs below** (only if we keep them): Spending, Budget, Cash flow – with short labels ("Spending," "Budget," "Cash flow"). Default tab = Spending or Recent.

**Simplify:**
- Entity filter: hide for single-entity users; show as "View: All" / "View: [Name]" only if user has more than one.
- Currency: keep in Settings or a small, non-prominent control (e.g. in user menu or footer). Don’t lead with it on Dashboard.
- Remove or collapse "Net Worth History" until we have real data; no mock charts.

**Copy:**
- "This week": "You spent $X" / "On track" / "Over by $X"
- "Recent transactions" / "View all"

### 3.4 Transactions page

**Purpose:** "See and manage your transactions."

**Layout:**
- **Header:**
  - Title: "Transactions"
  - Subtext: "Search and filter below."
  - **One primary button:** "Add transactions" (same as Dashboard – opens upload flow).
  - **Secondary actions in a "More" or "..." menu:** Find duplicates, View transfers, Add one manually. Not four equal buttons.

**List:**
- Search (by description), filter by category, filter by date. Simple controls.
- Table: Date, Description, Amount, Category. Click row to edit (especially category).
- Empty state: "No transactions yet. Add your first transactions to get started." + same "Add transactions" button.

**Copy:**
- Page title: "Transactions"
- Subtext: "Search and filter below."
- Primary button: "Add transactions"
- Empty state: "No transactions yet. Add your first transactions to get started."

### 3.5 Add transactions (modal or full-screen)

**Purpose:** "Get transactions in with minimal steps."

**Flow:**
1. **Single default:** "Upload a file (CSV, Excel) or paste from your bank."
   - File drop zone + "or paste here" text area.
   - One "Continue" or "Next" after file/paste.
2. **Review step:** Table of parsed rows. Editable. "Pick an account" if we have accounts; otherwise default to "Default" or "My account."
3. **Save:** "Save X transactions." After save: toast "X transactions added. Y categorized." Modal closes; user lands on Transactions or Dashboard.

**Simplify:**
- No "AI (Recommended)" vs "Advanced" as two equal tabs. One flow: upload/paste → we parse and categorize (AI behind the scenes) → review → save.
- "Advanced" (column mapping, CSV options) = "More options" or "Having trouble? Map columns" link for edge cases.
- No jargon in labels: "Account" not "Asset account"; "Category" stays.

**Copy:**
- Title: "Add transactions"
- Step 1: "Upload a file or paste your bank statement"
- Placeholder: "Drop CSV or Excel here, or paste from your bank"
- Step 2: "Review and save"
- Button: "Save X transactions"
- Success toast: "X transactions added. View list."

### 3.6 Uncategorized transactions

**Purpose:** "Fix categories so we learn for next time."

- **When there are uncategorized:** List with "Choose category" per row. Subtext: "We’ll remember your choices for similar transactions."
- **When none:** "All set – every transaction has a category." Positive empty state.

### 3.7 Reports

**Purpose:** "Dive into spending and income."

- **Simplify:** One entry: "Reports" in sidebar. Inside: clear report types with plain names:
  - "Spending by category"
  - "Income vs expenses"
  - "Cash flow"
  - "Net worth over time"
- One "Start here" or suggested report (e.g. "Spending by category") with one-line description. Rest in a list or secondary tabs.
- Responsive: tabs scroll or become a dropdown on small screens.

### 3.8 Sidebar (simplified for laymen)

**Primary (always visible):**
- Home (Dashboard)
- Transactions (with sub: All, Uncategorized, Transfers if we keep them)
- Reports

**Secondary (grouped under "More" or at bottom):**
- Accounts
- Budgets
- Entities (or "Profiles")
- Households
- Assets & liabilities
- AI CFO
- Analytics
- Settings

**Alternative:** Keep all links but add a visual group: "Main" (Home, Transactions, Reports) and "More" (collapsible). Labels must be plain: "Spending reports" not "Reports"; "Accounts" not "Assets/Liabilities" unless we split.

### 3.9 Settings

- Profile (name, email), currency, notifications. Optional: "Default account for new transactions."
- No entity/household setup required for first use; "Add profile" or "Manage entities" for power users.

---

## 4. Copy and tone

- **Headlines:** Short, benefit-led. "Your money at a glance," "See where your money goes."
- **Buttons:** Verbs. "Add transactions," "Save," "View list," "Try with sample data."
- **Empty states:** One sentence + one action. "No transactions yet. Add your first transactions to get started."
- **Success:** Specific and positive. "12 transactions added. 10 categorized." "All set – every transaction has a category."
- **Errors:** Plain language. "We couldn’t read that file. Try a CSV or Excel file."

**Avoid:** "Financial overview," "Manage your transactions," "Entity," "Liability," "Net worth" (unless we add a one-line tooltip or subtitle). Prefer "Your money," "Transactions," "Spending," "Balance."

---

## 5. Delight moments

- **After first upload:** Toast + optional short confetti or checkmark animation. "You’re in! X transactions added."
- **Dashboard with data:** "This week" and net worth appear; no loading jargon.
- **All categorized:** "All set – we’ve got a category for everything."
- **No duplicates:** "No duplicates found. You’re good."
- **On track (budgets):** "You’re on track this week" with a simple visual (e.g. green dot or icon).

---

## 6. Strict "Do Not" rules (no unnecessary complexity)

These are non-negotiable for the layman MVP. Violating them reintroduces complexity and cognitive load.

### 6.1 Navigation and IA

- **Do not** add new top-level sidebar items without moving something to "More" first. The main nav must stay minimal (Home, Transactions, Reports). *Reason: Every new item competes for attention and asks "do I need this?"*
- **Do not** add breadcrumbs, nested menus beyond one level, or "quick switcher" keyboards unless the product has 20+ primary screens. *Reason: Laymen need one obvious path, not multiple ways to get somewhere.*
- **Do not** expose Entities, Households, Assets, Liabilities, AI CFO, or Analytics as primary or equal to Home/Transactions/Reports. They belong under "More" or Settings. *Reason: Power features overwhelm first-time users; they can discover them later.*

### 6.2 Buttons and actions

- **Do not** put more than one primary (filled/high-emphasis) button in a header or above the fold. One primary action per screen; everything else secondary (outline) or in a menu. *Reason: Multiple primary buttons create decision paralysis ("which one do I click?").*
- **Do not** add "Quick add," "Fast entry," or alternate entry flows without folding them into the single "Add transactions" path (e.g. "Add one by hand" as a link inside that flow). *Reason: Two ways to add = confusion about when to use which.*
- **Do not** add bulk actions (e.g. "Select all," "Bulk categorize") until the single-row flow is clearly the default and bulk is behind "Select" or "More." *Reason: Bulk implies power-user; laymen think one at a time first.*

### 6.3 Copy and terminology

- **Do not** use jargon in the main path: no "Entity," "Liability," "Asset account," "Net worth" (without a one-line plain-English explanation), "Reconciliation," "Double-entry." Use "Your money," "Transactions," "Spending," "Balance," "Account." *Reason: Jargon signals "this is for experts" and increases drop-off.*
- **Do not** use passive or vague copy: e.g. "Transactions may be categorized" or "Data will be processed." Use active, specific: "We've categorized 10 of 12" or "12 transactions added." *Reason: Vague copy erodes trust and leaves users unsure what happened.*
- **Do not** add tooltips, help icons, or "Learn more" links for basic flows (Dashboard, Add transactions, Transactions list). If it needs explanation, simplify the flow or the label instead. *Reason: Help crutches are a sign the UI isn't self-explanatory.*

### 6.4 Data and features

- **Do not** show mock, placeholder, or fake data (e.g. hardcoded net worth history, sample charts). Either show real data or a clear empty state with one CTA. *Reason: Fake data misleads and breaks trust when users realize it's not theirs.*
- **Do not** add optional steps or "nice to have" fields to the main Add-transactions flow (e.g. tags, custom fields, "Link to receipt"). Keep: file/paste → review → save. *Reason: Every optional field is a decision; laymen want to finish quickly.*
- **Do not** add filters, toggles, or "View as" options (e.g. "View by entity," "Group by month") until the default view is clearly the one 80% need. *Reason: Choice overload; one good default beats many options.*

### 6.5 Modals and flows

- **Do not** use multi-tab modals where one flow would do. Add transactions = one flow (upload/paste → review → save). "Advanced" = one link or collapsible section, not a second tab of equal weight. *Reason: Tabs suggest two audiences; we're designing for one (laymen) first.*
- **Do not** add confirmation dialogs for non-destructive actions (e.g. "Are you sure you want to save?"). Reserve confirmations for delete, overwrite, or irreversible financial actions. *Reason: Extra clicks and doubt slow users and feel paternalistic.*
- **Do not** add onboarding tours, multi-step product tours, or "Did you know?" popovers on first login unless we have data showing drop-off at a specific step. Prefer a minimal empty state with one CTA. *Reason: Tours are band-aids for unclear UI and often get skipped or forgotten.*

### 6.6 Technical and product

- **Do not** add feature flags, A/B tests, or "layman vs power user" modes in the UI. Build one simple path; power features live in "More" or Settings, not behind a mode switch. *Reason: Modes duplicate maintenance and create "which mode am I in?" confusion.*
- **Do not** add new dependencies or infra (e.g. real-time sync, offline queue, new backend service) for the layman MVP unless they unblock the single "add transactions → see spending" path. *Reason: Scope creep; MVP validates feeling, not tech.*
- **Do not** require the user to create an Entity, Account, or Household before adding their first transaction. Default to "Me" or "Default" and allow setup later. *Reason: Friction at cold start is the #1 cause of abandonment.*

### 6.7 Summary checklist

Before shipping any change, confirm:

- [ ] No new primary button competes with the one main action on that screen.
- [ ] No new nav item in the top-level sidebar without demoting something to "More."
- [ ] No jargon in labels or copy in the main path.
- [ ] No mock or fake data; real data or empty state only.
- [ ] No new required step or field in the Add-transactions flow.
- [ ] No second tab or equal-weight "Advanced" in the upload modal.
- [ ] No confirmation dialog for non-destructive actions.
- [ ] No onboarding tour or multi-step wizard for basic flows.

---

## 7. What we remove or hide (reference)

- Don't lead with: Entity filter, currency selector, Households, Entities, Assets/Liabilities, AI CFO, Analytics.
- Don't show: Mock data. Either real data or "Add transactions to see this."
- Don't use: Four equal buttons on Transactions. One primary, rest in "More."
- Don't use: "AI-Powered" and "Advanced" as equal tabs in upload. One flow; advanced = "More options."

---

## 8. Implementation order

1. **Empty states:** Dashboard and Transactions get the new copy and single CTA; remove or hide entity/currency from empty Dashboard.
2. **Transactions page:** One primary "Add transactions"; move Find duplicates, View transfers, Add manually into a dropdown or secondary row.
3. **Add transactions flow:** Single default path (upload/paste); "Advanced" as link or "More options."
4. **Sidebar:** Add "Accounts"; group "Main" vs "More" (or collapse advanced items).
5. **Dashboard with data:** "This week" card; real net worth; recent transactions; hide or fix Net Worth History.
6. **Copy pass:** Apply this doc’s copy across Login, Dashboard, Transactions, Upload, Uncategorized, Reports.
7. **Delight:** Toasts and positive empty states as above.

---

## 9. Success criteria (laymen)

- A new user can go from signup to "I see my spending" in under 10 minutes (add transactions → see Dashboard with numbers).
- No screen has more than one primary button.
- No jargon in the main path (Entities, Liabilities, etc. only in "More" or Settings).
- Empty states always answer "What do I do?" with one sentence and one action.
