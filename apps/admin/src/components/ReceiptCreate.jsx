/**
 * ReceiptCreate - Manual Transaction Entry
 * 
 * Allows users to manually add income, expenses, and other transactions
 * Perfect for initial setup: salary, dividends, recurring income
 */

import { 
  Create, 
  SimpleForm, 
  TextInput, 
  NumberInput, 
  DateInput, 
  SelectInput, 
  BooleanInput,
  required,
  useNotify,
  useRedirect,
} from 'react-admin';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingUp, 
  TrendingDown,
  SwapHoriz,
  Undo,
} from '@mui/icons-material';

// Transaction Types
const TRANSACTION_TYPES = [
  { id: 'INCOME', name: '💰 Income (收入)', icon: <TrendingUp color="success" /> },
  { id: 'EXPENSE', name: '💸 Expense (支出)', icon: <TrendingDown color="error" /> },
  { id: 'TRANSFER', name: '🔄 Transfer (转账)', icon: <SwapHoriz color="info" /> },
  { id: 'REFUND', name: '↩️ Refund (退款)', icon: <Undo color="warning" /> },
];

// Document Types
const DOCUMENT_TYPES = [
  { id: 'PAYCHECK', name: '💵 Paycheck / Salary (工资单)' },
  { id: 'RECEIPT', name: '🧾 Receipt (收据)' },
  { id: 'INVOICE', name: '📄 Invoice (发票)' },
  { id: 'BANK_STATEMENT', name: '🏦 Bank Statement (银行对账单)' },
  { id: 'CREDIT_CARD_STATEMENT', name: '💳 Credit Card Statement (信用卡账单)' },
  { id: 'BILL', name: '📋 Bill (账单)' },
  { id: 'TAX_DOCUMENT', name: '📑 Tax Document (税务文件)' },
  { id: 'OTHER', name: '📎 Other (其他)' },
];

// Income Categories
const INCOME_CATEGORIES = [
  { id: 'Salary', name: '💼 Salary (工资)' },
  { id: 'Bonus', name: '🎁 Bonus (奖金)' },
  { id: 'Dividend', name: '📈 Dividend (分红)' },
  { id: 'Investment', name: '💹 Investment Returns (投资收益)' },
  { id: 'Freelance', name: '💻 Freelance (自由职业)' },
  { id: 'Rental', name: '🏠 Rental Income (租金收入)' },
  { id: 'Interest', name: '🏦 Interest (利息)' },
  { id: 'Gift', name: '🎀 Gift Received (收到礼物)' },
  { id: 'Refund', name: '↩️ Refund (退款)' },
  { id: 'Other Income', name: '📋 Other Income (其他收入)' },
];

// Expense Categories
const EXPENSE_CATEGORIES = [
  { id: 'Housing', name: '🏠 Housing (住房)' },
  { id: 'Transportation', name: '🚗 Transportation (交通)' },
  { id: 'Groceries', name: '🛒 Groceries (日用杂货)' },
  { id: 'Dining', name: '🍽️ Dining (餐饮)' },
  { id: 'Utilities', name: '💡 Utilities (水电煤)' },
  { id: 'Healthcare', name: '🏥 Healthcare (医疗)' },
  { id: 'Entertainment', name: '🎬 Entertainment (娱乐)' },
  { id: 'Shopping', name: '🛍️ Shopping (购物)' },
  { id: 'Subscriptions', name: '📱 Subscriptions (订阅)' },
  { id: 'Insurance', name: '🛡️ Insurance (保险)' },
  { id: 'Education', name: '📚 Education (教育)' },
  { id: 'Travel', name: '✈️ Travel (旅行)' },
  { id: 'Personal Care', name: '💅 Personal Care (个人护理)' },
  { id: 'Financial', name: '🏦 Financial (金融费用)' },
  { id: 'Gifts & Donations', name: '🎁 Gifts & Donations (礼物和捐赠)' },
  { id: 'Pets', name: '🐕 Pets (宠物)' },
  { id: 'Kids & Family', name: '👨‍👩‍👧 Kids & Family (家庭)' },
  { id: 'Misc', name: '📋 Miscellaneous (其他)' },
];

// Payment Methods
const PAYMENT_METHODS = [
  { id: 'PAYROLL', name: '💵 Payroll / Direct Deposit (工资直接存款)' },
  { id: 'BANK_TRANSFER', name: '🏦 Bank Transfer (银行转账)' },
  { id: 'CHECK', name: '📝 Check (支票)' },
  { id: 'CREDIT_CARD', name: '💳 Credit Card (信用卡)' },
  { id: 'DEBIT_CARD', name: '💳 Debit Card (借记卡)' },
  { id: 'CASH', name: '💵 Cash (现金)' },
  { id: 'PAYPAL', name: '🅿️ PayPal' },
  { id: 'VENMO', name: '📱 Venmo' },
  { id: 'APPLE_PAY', name: '🍎 Apple Pay' },
  { id: 'GOOGLE_PAY', name: '🔵 Google Pay' },
  { id: 'CRYPTO', name: '₿ Cryptocurrency (加密货币)' },
  { id: 'AUTO_PAY', name: '🔄 Auto Pay (自动扣款)' },
  { id: 'OTHER', name: '📋 Other (其他)' },
];

// Subcategories for Income
const INCOME_SUBCATEGORIES = {
  Salary: ['Monthly Salary', 'Bi-weekly Pay', 'Weekly Pay', 'Overtime', 'Commission'],
  Bonus: ['Year-end Bonus', 'Performance Bonus', 'Sign-on Bonus', 'Referral Bonus'],
  Dividend: ['Stock Dividend', 'Fund Distribution', 'REIT Dividend'],
  Investment: ['Capital Gains', 'Interest', 'Rental Yield'],
  Freelance: ['Contract Work', 'Consulting', 'Side Gig'],
};

const SectionTitle = ({ children, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 3 }}>
    {icon}
    <Typography variant="h6" fontWeight={600} color="primary">
      {children}
    </Typography>
  </Box>
);

const QuickAmountButtons = ({ onChange }) => {
  const amounts = [1000, 2000, 3000, 5000, 8000, 10000];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
        Quick Amount (快速金额):
      </Typography>
      {amounts.map(amt => (
        <Chip
          key={amt}
          label={`$${amt.toLocaleString()}`}
          onClick={() => onChange(amt)}
          size="small"
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}
        />
      ))}
    </Stack>
  );
};

export const ReceiptCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSuccess = () => {
    notify('Transaction added successfully! 交易添加成功', { type: 'success' });
    redirect('list', 'receipts');
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <Create 
      mutationOptions={{ onSuccess: handleSuccess }}
      sx={{ maxWidth: 800, mx: 'auto' }}
    >
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="primary.dark" gutterBottom>
            ➕ Add Transaction
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manually add income, expenses, or transfers. Perfect for paycheck, dividends, and recurring transactions.
            <br />
            手动添加收入、支出或转账。适合工资、分红和周期性交易。
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Tip:</strong> For regular salary, set "Recurring" to Yes. The system will track your income patterns.
          <br />
          <strong>提示：</strong> 对于固定工资，请将"周期性"设为是。系统会跟踪您的收入模式。
        </Alert>

        <SimpleForm>
          {/* Transaction Type Section */}
          <SectionTitle icon={<AttachMoney color="primary" />}>
            Transaction Type (交易类型)
          </SectionTitle>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <SelectInput 
              source="type" 
              choices={TRANSACTION_TYPES}
              defaultValue="INCOME"
              validate={required()}
              sx={{ minWidth: 200 }}
              helperText="Select INCOME for salary, dividends | 选择 INCOME 用于工资、分红"
            />
            <SelectInput 
              source="documentType" 
              choices={DOCUMENT_TYPES}
              defaultValue="PAYCHECK"
              sx={{ minWidth: 250 }}
              helperText="Document type | 文档类型"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Basic Info Section */}
          <SectionTitle icon={<TrendingUp color="success" />}>
            Transaction Details (交易详情)
          </SectionTitle>

          <TextInput 
            source="storeName" 
            label="Source / Payer Name (来源/付款人)"
            validate={required()}
            fullWidth
            helperText="e.g., ABC Company, Employer Name, Investment Account | 如：公司名称、雇主、投资账户"
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <NumberInput 
                source="totalAmount" 
                label="Amount (金额)"
                validate={required()}
                min={0}
                step={0.01}
                helperText="Enter the total amount | 输入总金额"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <SelectInput 
                source="currency"
                label="Currency"
                choices={[
                  { id: 'USD', name: '🇺🇸 USD' },
                  { id: 'CAD', name: '🇨🇦 CAD' },
                  { id: 'CNY', name: '🇨🇳 CNY' },
                  { id: 'EUR', name: '🇪🇺 EUR' },
                  { id: 'GBP', name: '🇬🇧 GBP' },
                ]}
                defaultValue="USD"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <DateInput 
                source="transactionDate" 
                label="Date (日期)"
                validate={required()}
                defaultValue={today}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Category Section */}
          <SectionTitle icon={<AttachMoney color="primary" />}>
            Categorization (分类)
          </SectionTitle>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <SelectInput 
              source="category" 
              label="Category (类别)"
              choices={[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]}
              validate={required()}
              sx={{ minWidth: 250 }}
              helperText="Main category | 主分类"
            />
            <TextInput 
              source="subcategory" 
              label="Subcategory (子类别)"
              sx={{ minWidth: 200 }}
              helperText="e.g., Monthly Salary, Q4 Dividend | 如：月薪、Q4分红"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Method Section */}
          <SectionTitle icon={<SwapHoriz color="info" />}>
            Payment Details (支付详情)
          </SectionTitle>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <SelectInput 
              source="paymentMethod" 
              label="Payment Method (支付方式)"
              choices={PAYMENT_METHODS}
              defaultValue="PAYROLL"
              sx={{ minWidth: 280 }}
            />
            <TextInput 
              source="paymentAccount" 
              label="Account Name (账户名称)"
              sx={{ minWidth: 200 }}
              helperText="e.g., Chase Checking, Fidelity | 如：招商银行、工商银行"
            />
            <TextInput 
              source="cardLast4" 
              label="Last 4 Digits (后四位)"
              sx={{ width: 120 }}
              helperText="Optional"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Additional Info */}
          <SectionTitle icon={<TrendingUp color="success" />}>
            Additional Settings (其他设置)
          </SectionTitle>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <BooleanInput 
              source="isRecurring" 
              label="Recurring Transaction (周期性交易)"
              helperText="Enable for salary, subscriptions | 对于工资、订阅请开启"
            />
            <BooleanInput 
              source="isTaxDeductible" 
              label="Tax Deductible (可抵税)"
            />
            <BooleanInput 
              source="isBusinessExpense" 
              label="Business Expense (商业支出)"
            />
          </Box>

          <TextInput 
            source="notes" 
            label="Notes (备注)"
            multiline
            rows={2}
            fullWidth
            helperText="Any additional notes | 任何额外说明"
          />

          <TextInput 
            source="storeLocation" 
            label="Location (地点)"
            fullWidth
            helperText="City, State or Address | 城市、地址"
          />

        </SimpleForm>
      </Paper>
    </Create>
  );
};

export default ReceiptCreate;


