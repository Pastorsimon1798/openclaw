# Email Management Setup Guide

**Created:** 2026-01-30  
**For:** Simon Gonzalez  
**Setup Status:** Pending Gmail delegation confirmation

---

## Part 1: Gmail Delegation Setup (gonzalez.simon@gmail.com)

### Step 1: Grant Access (you do this once)

1. Open Gmail → Click gear icon → **"See all settings"**
2. Go to **"Accounts and Import"** tab
3. Section **"Grant access to your account"** → Click **"Add another account"**
4. Enter: `clawdbot@puenteworks.com`
5. Click **"Next Step"** → **"Send email to grant access"**

### Step 2: I Confirm (automatic once you send)

I'll receive an email at clawdbot@puenteworks.com. I accept → can now access your Gmail.

### Step 3: I Configure Everything (I do this)

Once I have access, I'll set up:

| Filter | Action |
|--------|--------|
| `from:(amazon.com OR ebay.com OR receipts)` | Label: "Receipts/Orders" → Skip inbox |
| `from:(banking OR investment OR "credit card")` | Label: "Financial" → Mark important |
| `subject:(urgent OR "action required" OR deadline)` | Label: "Urgent-Attention" → Star + Keep in inbox |
| `from:(linkedin.com OR indeed.com OR jobs)` | Label: "Job-Related" → Skip inbox |
| `is:unread older_than:7d` | Archive (keep unread, remove from inbox) |

### Step 4: Weekly Summary

Every Sunday, I'll send you a digest of what I processed: receipts archived, urgent items flagged, anything that needs your eyes.

---

## Part 2: iCloud Mail Rules Recommendation

iCloud doesn't support delegation, but you can create server-side rules that mimic the same workflow.

### Create at: [icloud.com/mail](https://icloud.com/mail)

**How to create rules:**
1. Go to [icloud.com](https://icloud.com) → Mail → Gear icon → **"Rules"**
2. Click **"Add a Rule"** for each one below
3. Set condition → Choose action → Save

### Recommended Rules

---

#### Rule 1: Receipts → Separate Folder

```
If: From contains (amazon, ebay, receipt, order, invoice, "your purchase")
Then: Move to folder "Receipts" and Mark as Read
```

---

#### Rule 2: Financial → Flag for Review

```
If: From contains (bank, chase, wells fargo, "credit card", investment, fidelity, schwab)
Then: Copy to folder "Financial" and Flag
```

---

#### Rule 3: Newsletters → Batch Folder

```
If: From contains (substack, newsletter, noreply, "do not reply") OR Subject contains ("unsubscribe")
Then: Move to folder "Newsletters"
```

---

#### Rule 4: Urgent → Keep in Inbox + Highlight

```
If: Subject contains (urgent, "action required", deadline, "respond by", asana, "meeting in")
Then: Flag and Keep in Inbox
```

---

#### Rule 5: Job/LinkedIn → Separate Folder

```
If: From contains (linkedin, indeed, glassdoor) OR Subject contains (job, "new position", "hiring")
Then: Move to folder "Job-Search"
```

---

## Next Steps Checklist

- [ ] Step 1: Send Gmail delegation to `clawdbot@puenteworks.com`
- [ ] Reply "done" — I'll confirm access + set up all Gmail filters
- [ ] Optionally create the iCloud rules (manual setup required)

---

## Post-Setup Notes

*Add any notes here after setup is complete...*

