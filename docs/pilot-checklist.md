# Pilot Checklist

> Living document tracking the nine pilot user stories.
> Written for the product owner.
>
> **Legend:** Done / To Do

---

## Progress

```mermaid
pie title Story Completion
    "Done - Story 1 Auth" : 1
    "To Do - Story 2 Session" : 1
    "To Do - Story 3 Create" : 1
    "To Do - Story 4 Edit" : 1
    "To Do - Story 5 Recalc" : 1
    "To Do - Story 6 Validate" : 1
    "To Do - Story 7 Fiscal" : 1
    "To Do - Story 8 XML" : 1
    "To Do - Story 9 PDF" : 1
```

## Story Dependencies

```mermaid
graph LR
    S1["1. Auth"] --> S2["2. Session"]
    S1 --> S3["3. Create Invoice"]
    S3 --> S4["4. Edit Invoice"]
    S3 --> S5["5. Recalculation"]
    S5 --> S6["6. Validation"]
    S6 --> S7["7. Fiscal Rules"]
    S7 --> S8["8. XML Generation"]
    S7 --> S9["9. PDF Generation"]
```

---

## Story 1 - Authentication (DONE)

> Salma can log in securely with a username and password.

```mermaid
graph LR
    A["Login Screen"] --> B["Enter Credentials"]
    B --> C{"Valid?"}
    C -->|Yes| D["Session Created"]
    C -->|No| E["Error Message"]
    C -->|Locked| F["Account Locked 30s"]
    D --> G["Main App"]
```

| # | Task | Status |
|---|---|:---:|
| 1.1 | Login screen with username and password fields | Done |
| 1.2 | Backend checks password against the database | Done |
| 1.3 | Clear error message when password is wrong | Done |
| 1.4 | Account locks after 3 failed attempts, 30s cooldown | Done |
| 1.5 | Registration screen for new users | Done |
| 1.6 | Reject duplicate usernames on registration | Done |
| 1.7 | Session persists so Salma is not re-prompted immediately | Done |

---

## Story 2 - Session Timeout

> Salma's session locks automatically after 15 minutes of inactivity.

```mermaid
sequenceDiagram
    participant Salma
    participant UI as React App
    participant Timer as Idle Timer
    participant Auth as Auth System

    Salma->>UI: Uses the app normally
    UI->>Timer: Reset on every interaction
    Note over Timer: 15 minutes pass with no activity
    Timer->>Auth: Clear session
    Auth->>UI: Redirect to login
    UI->>Salma: Your session has expired
```

| # | Task | Status |
|---|---|:---:|
| 2.1 | Start an idle timer when Salma stops interacting | To Do |
| 2.2 | After 15 min, return to the login screen automatically | To Do |
| 2.3 | Clear the session so she must re-enter her password | To Do |
| 2.4 | Reset the timer on any click, keystroke, or mouse move | To Do |

---

## Story 3 - Invoice Creation

> Salma can manually create an invoice with all required fields.

```mermaid
graph TD
    A["Open Invoice Form"] --> B["Fill Header: number, date, client, tax ID"]
    B --> C["Add Line Items: description, qty, price, VAT"]
    C --> D["Review Totals"]
    D --> E{"Save?"}
    E -->|Yes| F["Saved to Database"]
    E -->|No| C
```

| # | Task | Status |
|---|---|:---:|
| 3.1 | Invoice form: number, date, client name, client tax ID | To Do |
| 3.2 | Add one or more line items: description, quantity, price | To Do |
| 3.3 | Select a VAT rate per line | To Do |
| 3.4 | Save the invoice to the local database | To Do |
| 3.5 | Confirmation message after saving | To Do |

---

## Story 4 - Invoice Editing

> Salma can open and edit any invoice she has already created.

```mermaid
graph LR
    A["Invoice List"] --> B["Select Invoice"]
    B --> C["Edit Form"]
    C --> D{"Already confirmed?"}
    D -->|No| E["Save Changes"]
    D -->|Yes| F["Read-only"]
```

| # | Task | Status |
|---|---|:---:|
| 4.1 | List view of all saved invoices | To Do |
| 4.2 | Click an invoice to open it in the edit form | To Do |
| 4.3 | Allow changes to any field | To Do |
| 4.4 | Save updated invoice to the database | To Do |
| 4.5 | Block editing of confirmed invoices | To Do |

---

## Story 5 - Live Recalculation

> Totals update automatically whenever Salma changes a line.

```mermaid
graph LR
    A["Qty x Price"] -->|per line| B["Line Total"]
    B --> C["Sum All Lines"]
    C --> D["Pre-tax Total"]
    D --> E["x VAT Rate"]
    E --> F["VAT Amount"]
    D --> G["Pre-tax + VAT"]
    F --> G
    G --> H["Grand Total"]
```

| # | Task | Status |
|---|---|:---:|
| 5.1 | Recalculate pre-tax total when quantity or price changes | To Do |
| 5.2 | Recalculate VAT amount when rate or subtotal changes | To Do |
| 5.3 | Recalculate grand total in real time | To Do |
| 5.4 | Display all three totals visibly on the form | To Do |

---

## Story 6 - Requirement Validation

> The system validates that a completed invoice meets all TEIF requirements.

```mermaid
graph TD
    A["Invoice Draft"] --> B["Run TEIF Validation"]
    B --> C{"All fields valid?"}
    C -->|Yes| D["Ready to Confirm"]
    C -->|No| E["Highlight Missing Fields"]
    E --> F["Salma fixes issues"]
    F --> B
```

| # | Task | Status |
|---|---|:---:|
| 6.1 | Define the full list of mandatory fields per TEIF rules | To Do |
| 6.2 | Check every required field before confirmation | To Do |
| 6.3 | Highlight which fields are missing or invalid | To Do |
| 6.4 | Block confirmation until all validations pass | To Do |

---

## Story 7 - Fiscal Inconsistencies

> The system detects fiscal errors like wrong VAT rate or threshold violations.

```mermaid
graph TD
    A["Validated Invoice"] --> B["Fiscal Rules Engine"]
    B --> C{"VAT rate correct?"}
    B --> D{"Threshold respected?"}
    C -->|No| E["VAT Warning"]
    D -->|No| F["Threshold Warning"]
    C -->|Yes| G["Pass"]
    D -->|Yes| G
    E --> H["Salma reviews and fixes"]
    F --> H
    H --> B
```

| # | Task | Status |
|---|---|:---:|
| 7.1 | Fiscal rules engine checking Tunisian tax rules | To Do |
| 7.2 | Detect mismatched VAT rates for product types | To Do |
| 7.3 | Detect invoices crossing legal thresholds | To Do |
| 7.4 | Plain-language warning listing every inconsistency | To Do |
| 7.5 | Allow Salma to fix and re-validate before confirming | To Do |

---

## Story 8 - XML Generation

> The system generates a TEIF-compliant XML and validates it against the XSD.

```mermaid
graph LR
    A["Confirmed Invoice"] --> B["XML Builder"]
    B --> C["Raw XML"]
    C --> D["XSD Validator"]
    D --> E{"Valid?"}
    E -->|Yes| F["Save .xml"]
    E -->|No| G["Show Errors"]
    F --> H["Digital Signature"]
    H --> I["Ready for El Fatoora"]
```

| # | Task | Status |
|---|---|:---:|
| 8.1 | XML generation mapping invoice data to TEIF structure | To Do |
| 8.2 | Validate generated XML against official XSD | To Do |
| 8.3 | Show validation result: pass or error list | To Do |
| 8.4 | Save or export the XML file | To Do |
| 8.5 | Digital signature verifiable by El Fatoora sandbox | To Do |

---

## Story 9 - PDF Generation

> The system generates a printable PDF with a QR code and legal mentions.

```mermaid
graph LR
    A["Confirmed Invoice"] --> B["pdfkit Layout"]
    A --> C["QR Code Generator"]
    C --> B
    B --> D["Preview PDF"]
    D --> E["Save or Print"]
```

| # | Task | Status |
|---|---|:---:|
| 9.1 | PDF layout with mandatory mentions: seller, buyer, tax ID, totals | To Do |
| 9.2 | Generate QR code with verification data | To Do |
| 9.3 | Embed QR code in the PDF | To Do |
| 9.4 | Preview the PDF before saving | To Do |
| 9.5 | Save or print the PDF | To Do |

---

## Exit Criteria

```mermaid
graph LR
    E1["XML passes XSD with zero errors"]
    E2["Signature verified by El Fatoora"]
    E3["User completes workflow unassisted in under 10 min"]
    E1 --> PASS["PILOT CLEARED"]
    E2 --> PASS
    E3 --> PASS
```

| # | Condition | Status |
|---|---|:---:|
| E1 | Generated XML accepted by TEIF XSD with zero errors | To Do |
| E2 | Signature recognized by El Fatoora in sandbox mode | To Do |
| E3 | Non-technical user completes full workflow unassisted in under 10 min | To Do |
