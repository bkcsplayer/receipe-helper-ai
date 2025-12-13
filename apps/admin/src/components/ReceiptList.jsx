import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  TextInput,
  FunctionField,
  SelectInput,
  useListContext,
} from 'react-admin';
import {
  Chip,
  Stack,
  Box,
  Typography,
  Avatar,
  Tooltip,
  alpha,
  Card,
} from '@mui/material';
import {
  Store as StoreIcon,
  Email as EmailIcon,
  Web as WebIcon,
  Telegram as TelegramIcon,
  Api as ApiIcon,
  SmartToy as AiIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';

// Generate current and past months for filter
const getMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    months.push({ id: value, name: label });
  }
  return months;
};

const receiptFilters = [
  <SelectInput
    key="month"
    source="month"
    label="Month"
    choices={getMonthOptions()}
    alwaysOn
    sx={{ minWidth: 180 }}
  />,
  <TextInput key="storeName" source="storeName" label="Store Name" />,
  <SelectInput
    key="category"
    source="category"
    label="Category"
    choices={[
      { id: 'Fuel', name: '⛽ Fuel' },
      { id: 'Maintenance', name: '🔧 Maintenance' },
      { id: 'Groceries', name: '🛒 Groceries' },
      { id: 'Dining', name: '🍽️ Dining' },
      { id: 'Shopping', name: '🛍️ Shopping' },
      { id: 'Other', name: '📦 Other' },
    ]}
  />,
  <SelectInput
    key="source"
    source="source"
    label="Source"
    choices={[
      { id: 'WEB', name: '🌐 Web Upload' },
      { id: 'EMAIL', name: '📧 Email' },
      { id: 'TELEGRAM', name: '📱 Telegram' },
      { id: 'API', name: '🔌 API' },
    ]}
  />,
];

// Source icon mapping
const getSourceIcon = (source) => {
  const icons = {
    EMAIL: <EmailIcon sx={{ fontSize: 14 }} />,
    WEB: <WebIcon sx={{ fontSize: 14 }} />,
    TELEGRAM: <TelegramIcon sx={{ fontSize: 14 }} />,
    API: <ApiIcon sx={{ fontSize: 14 }} />,
  };
  return icons[source] || <WebIcon sx={{ fontSize: 14 }} />;
};

const getSourceColor = (source) => {
  const colors = {
    EMAIL: '#2196F3',
    WEB: '#4CAF50',
    TELEGRAM: '#0088cc',
    API: '#9C27B0',
  };
  return colors[source] || '#666';
};

// Status chip with better styling
const StatusChip = ({ record }) => {
  if (!record) return null;
  const isCompleted = record.status === 'completed';
  return (
    <Chip
      label={record.status}
      size="small"
      sx={{
        bgcolor: isCompleted ? alpha('#4CAF50', 0.15) : alpha('#FFC107', 0.2),
        color: isCompleted ? '#2E7D32' : '#F57C00',
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
};

// Source chip with icon
const SourceChip = ({ record }) => {
  if (!record) return null;
  const color = getSourceColor(record.source);
  return (
    <Chip
      icon={getSourceIcon(record.source)}
      label={record.source}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.12),
        color: color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
        '& .MuiChip-icon': { color: color },
      }}
    />
  );
};

// Type indicator
const TypeIndicator = ({ record }) => {
  if (!record) return null;
  const isIncome = record.type === 'INCOME';
  return (
    <Tooltip title={isIncome ? 'Income' : 'Expense'}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isIncome ? alpha('#4CAF50', 0.15) : alpha('#F44336', 0.1),
        }}
      >
        {isIncome ? (
          <IncomeIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
        ) : (
          <ExpenseIcon sx={{ fontSize: 14, color: '#F44336' }} />
        )}
      </Box>
    </Tooltip>
  );
};

// AI indicator for records with estimated items
const AiIndicator = ({ record }) => {
  if (!record?.items?.some(item => item.isEstimated)) return null;
  return (
    <Tooltip title="Contains AI-estimated items">
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha('#9C27B0', 0.15),
        }}
      >
        <AiIcon sx={{ fontSize: 12, color: '#9C27B0' }} />
      </Box>
    </Tooltip>
  );
};

// Store cell with avatar
const StoreCell = ({ record }) => {
  if (!record) return null;
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: '#2A3A68',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}
      >
        {record.storeName?.charAt(0).toUpperCase() || 'R'}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
          {record.storeName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {record.storeLocation || '—'}
        </Typography>
      </Box>
    </Stack>
  );
};

// Amount cell with color coding
const AmountCell = ({ record }) => {
  if (!record) return null;
  const isIncome = record.type === 'INCOME';
  const amount = parseFloat(record.totalAmount) || 0;
  return (
    <Typography
      variant="body2"
      fontWeight={700}
      sx={{
        color: isIncome ? '#4CAF50' : '#2A3A68',
      }}
    >
      {isIncome ? '+' : ''}
      {new Intl.NumberFormat('en-US', { style: 'currency', currency: record.currency || 'USD' }).format(amount)}
    </Typography>
  );
};

// Category chip
const CategoryChip = ({ record }) => {
  if (!record?.category) return <Typography color="text.disabled">—</Typography>;
  
  const categoryColors = {
    Fuel: '#FF5722',
    Maintenance: '#2196F3',
    Groceries: '#4CAF50',
    Dining: '#E91E63',
    Shopping: '#9C27B0',
    Other: '#607D8B',
  };
  
  const color = categoryColors[record.category] || '#607D8B';
  
  return (
    <Chip
      label={record.category}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.12),
        color: color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
};

// Empty state component
const Empty = () => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 4,
    }}
  >
    <StoreIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No Receipts Found
    </Typography>
    <Typography variant="body2" color="text.disabled">
      Try adjusting your filters or upload some receipts first
    </Typography>
  </Box>
);

// List actions with stats
const ListActions = () => {
  const { total } = useListContext();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        <strong>{total || 0}</strong> receipts
      </Typography>
    </Box>
  );
};

export const ReceiptList = (props) => (
  <List
    {...props}
    perPage={25}
    sort={{ field: 'transactionDate', order: 'DESC' }}
    filters={receiptFilters}
    empty={<Empty />}
    actions={<ListActions />}
    sx={{
      '& .RaList-main': {
        bgcolor: 'transparent',
      },
    }}
  >
    <Datagrid
      rowClick="show"
      bulkActionButtons={false}
      sx={{
        '& .RaDatagrid-row': {
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: alpha('#FF8C42', 0.05),
          },
        },
        '& .RaDatagrid-headerCell': {
          bgcolor: alpha('#2A3A68', 0.05),
          fontWeight: 700,
          color: '#2A3A68',
        },
      }}
    >
      <FunctionField
        label=""
        render={(record) => <TypeIndicator record={record} />}
        sortable={false}
      />
      <DateField
        source="transactionDate"
        label="📅 Date"
        options={{ year: 'numeric', month: 'short', day: 'numeric' }}
      />
      <FunctionField
        label="🏪 Store"
        render={(record) => <StoreCell record={record} />}
        sortBy="storeName"
      />
      <FunctionField
        label="💰 Amount"
        render={(record) => <AmountCell record={record} />}
        sortBy="totalAmount"
      />
      <FunctionField
        label="📁 Category"
        render={(record) => <CategoryChip record={record} />}
        sortBy="category"
      />
      <FunctionField
        label="Status"
        render={(record) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <SourceChip record={record} />
            <StatusChip record={record} />
            <AiIndicator record={record} />
          </Stack>
        )}
        sortable={false}
      />
    </Datagrid>
  </List>
);
