# Receipt Manifestation App - Personal Finance Intelligence

A comprehensive personal finance management system with AI-powered receipt OCR, financial analysis, and automated reporting. Transform your receipts, invoices, and paychecks into actionable financial insights.

## 🌟 Features

### Core Functionality
- **📸 Receipt Capture**: Upload photos or PDFs via web interface
- **📧 Email Listening**: Auto-scan inbox for receipt attachments (IMAP)
- **💳 Paycheck Analysis**: Parse paystubs to track income, deductions, and taxes
- **🏦 Bank Statement Support**: Import credit card and bank statements
- **🤖 AI-Powered OCR**: Uses **Claude 3.5 Sonnet** via OpenRouter for accurate data extraction

### Financial Analysis
- **📊 Dashboard**: Real-time spending trends, category breakdowns, merchant rankings
- **💰 Income vs Expense**: Track cash flow, savings rate, and net worth
- **💳 Payment Method Tracking**: Monitor credit card usage and rewards optimization
- **📅 Date Range Filters**: Analyze any time period (day, month, quarter, year)
- **🎯 Budget Tracking**: Set and monitor budgets by category

### AI Intelligence
- **🧠 Financial Analysis**: Monthly AI-generated insights and recommendations
- **💡 Savings Opportunities**: Identify "convenience tax" and subscription creep
- **🛡️ Tax Strategy**: Flag tax-deductible expenses
- **📧 Email Reports**: Automated weekly/monthly HTML reports

### System Features
- **🖥️ Admin Dashboard**: Full back-office with React Admin
- **📊 Data Flow Visualization**: Real-time system status and pipeline monitoring
- **🧪 Test Data Management**: One-click mock data for testing
- **🔄 Token Tracking**: Monitor AI usage and costs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│  📧 Email Inbox         📸 Web Upload        🏦 Bank Sync        │
│  (IMAP Listener)        (React Frontend)    (Coming Soon)       │
│        │                       │                  │              │
│        └───────────┬───────────┴──────────────────┘              │
│                    ▼                                             │
├─────────────────────────────────────────────────────────────────┤
│                   🤖 AI PROCESSING                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ OpenRouter API (Claude 3.5 Sonnet)                      │    │
│  │ • OCR & Data Extraction                                 │    │
│  │ • Document Classification (Receipt/Invoice/Paycheck)   │    │
│  │ • Category & Merchant Recognition                       │    │
│  │ • Financial Analysis & Recommendations                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                    │                                             │
│                    ▼                                             │
├─────────────────────────────────────────────────────────────────┤
│                   📦 DATA STORAGE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ PostgreSQL   │  │ Cloudflare   │  │ Google Sheets    │       │
│  │ (Receipts,   │  │ R2           │  │ (Ledger)         │       │
│  │  Metrics,    │  │ (File        │  │                  │       │
│  │  Analysis)   │  │  Archive)    │  │                  │       │
│  └──────────────┘  └──────────────┘  └──────────────────┘       │
│                    │                                             │
│                    ▼                                             │
├─────────────────────────────────────────────────────────────────┤
│                   📊 OUTPUT & NOTIFICATIONS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ Admin        │  │ Email        │  │ Telegram         │       │
│  │ Dashboard    │  │ Reports      │  │ Notifications    │       │
│  └──────────────┘  └──────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 📧 Email Configuration

### Receipt Inbox (IMAP)
The system listens to a dedicated email inbox for receipt attachments.

**Recommended Setup:**
```
Email: receipts@yourdomain.com
Purpose: Forward all digital receipts here
```

**Environment Variables:**
```env
# Email Inbox (for receiving receipts)
IMAP_USER=receipts@yourdomain.com
IMAP_PASSWORD=your-email-password
IMAP_HOST=imap.yourdomain.com
IMAP_PORT=993
IMAP_TLS=true
```

### Report Delivery (SMTP)
Financial reports are sent via SMTP.

```env
# Email Sending (for reports)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reports@yourdomain.com
SMTP_PASSWORD=your-smtp-password

# Report Recipients
EMAIL_FROM=reports@yourdomain.com
EMAIL_REPORT_TO=you@yourdomain.com
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Admin Panel** | React Admin, Material UI, Recharts |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL, Prisma ORM |
| **AI** | OpenRouter (Claude 3.5 Sonnet) |
| **Storage** | Cloudflare R2, Google Drive |
| **Ledger** | Google Sheets |
| **Email** | IMAP (inbox), Nodemailer (outbox) |
| **Notifications** | Telegram Bot API |
| **Deployment** | Docker, Docker Compose |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- OpenRouter API Key
- Google Cloud Service Account

### Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourrepo/receipt-helper-ai.git
cd receipt-helper-ai

# 2. Install dependencies
npm install
cd server && npm install
cd ../apps/admin && npm install

# 3. Configure environment
cp server/env.example server/.env
# Edit server/.env with your credentials

# 4. Start PostgreSQL (Docker)
docker compose up -d postgres

# 5. Run migrations
cd server && npm run prisma:migrate

# 6. Start development servers
npm run dev  # Frontend + Backend
cd apps/admin && npm run dev  # Admin panel
```

### Docker Deployment

```bash
# 1. Configure environment
cp env.docker.example .env
cp server/env.example server/.env
# Edit both files with your credentials

# 2. Build and start all services
docker compose up -d --build

# 3. Run database migrations
docker compose exec server npx prisma db push

# 4. (Optional) Seed test data
docker compose exec server npm run seed:comprehensive
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `https://receipe2.khtain.com` | User-facing receipt upload |
| Admin | `https://receipe2admin.khtain.com` | Dashboard & Analytics |
| API | `http://localhost:3001` | REST API |

**Local Development:**
| Service | URL |
|---------|-----|
| Frontend | `http://localhost:8080` |
| Admin | `http://localhost:8082` |
| API | `http://localhost:3001` |

## 📊 Data Model

### Transaction Types
- `EXPENSE` - Regular spending
- `INCOME` - Salary, dividends, freelance
- `TRANSFER` - Between accounts
- `REFUND` - Returns and refunds

### Document Types
- `RECEIPT` - Store receipts
- `INVOICE` - Bills and invoices
- `PAYCHECK` - Salary/pay stubs
- `BANK_STATEMENT` - Bank statements
- `CREDIT_CARD_STATEMENT` - CC statements
- `BILL` - Utility bills

### Expense Categories
```
Housing:        Mortgage, Rent, Utilities, HOA, Insurance
Transportation: Car Payment, Gas, Insurance, Parking, Rideshare
Food:           Groceries, Dining Out, Delivery, Coffee
Healthcare:     Insurance, Doctor, Pharmacy, Dental
Entertainment:  Streaming, Games, Movies, Gym
Shopping:       Online, Retail, Electronics, Clothing
Subscriptions:  Software, Phone, Memberships
Financial:      Bank Fees, Interest, Investments
```

### Payment Methods
- Credit Cards (with card name/last4)
- Debit Cards
- Bank Transfer / ACH
- Cash
- Digital Wallets (Apple Pay, PayPal, Venmo)
- Auto-pay / Payroll

## 🧪 Testing

### Mock Data
The system includes comprehensive mock data generation for testing:

```bash
# Generate 3 months of realistic test data
docker compose exec server npm run seed:comprehensive

# Delete all mock data
docker compose exec server npm run mock:delete

# Reset (delete + regenerate)
docker compose exec server npm run mock:reset
```

Mock data includes:
- Bi-weekly paychecks with deductions
- Monthly bills (mortgage, utilities, subscriptions)
- Variable expenses (groceries, dining, shopping)
- Investment income
- Multiple payment methods

### Admin Dashboard Controls
- Navigate to **System** tab
- Click **Add Mock Data** or **Delete Mock Data**
- View real-time data flow and system status

## 📁 Project Structure

```
receipe-helper-ai/
├── apps/
│   └── admin/              # React Admin dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   │   ├── OverviewDashboard.jsx
│       │   │   │   └── SystemStatusPanel.jsx
│       │   │   ├── ReceiptList.jsx
│       │   │   └── ReceiptShow.jsx
│       │   └── lib/
│       │       └── api.js
│       └── Dockerfile
├── server/
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── scripts/
│   │   ├── seed-comprehensive-mock.js
│   │   └── import-lowdb.js
│   ├── services/
│   │   ├── receiptService.js
│   │   ├── metricsService.js
│   │   ├── analysisService.js
│   │   └── emailService.js
│   ├── index.js            # Express API server
│   └── worker.js           # Background job processor
├── src/                    # User-facing frontend
├── docker-compose.yml
└── README.md
```

## 🔐 Security Notes

- Never commit `.env` files
- Use strong passwords for email accounts
- Rotate API keys regularly
- Use service accounts for Google APIs
- Enable 2FA on all integrations

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for AI API access
- [Anthropic Claude](https://anthropic.com/) for OCR intelligence
- [React Admin](https://marmelab.com/react-admin/) for admin framework
- [Prisma](https://prisma.io/) for database ORM
