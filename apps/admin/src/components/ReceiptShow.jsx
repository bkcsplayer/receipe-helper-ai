import {
  Show,
  useRecordContext,
  useShowController,
} from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Store as StoreIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  LocalOffer as TagIcon,
  AttachMoney as MoneyIcon,
  CloudUpload as UploadIcon,
  SmartToy as AiIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Format date nicely
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Info Row Component
const InfoRow = ({ icon, label, value, chip, chipColor = 'default' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Avatar
      sx={{
        width: 36,
        height: 36,
        bgcolor: alpha('#2A3A68', 0.1),
        color: '#2A3A68',
        mr: 2,
      }}
    >
      {icon}
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      {chip ? (
        <Chip label={value} color={chipColor} size="small" sx={{ fontWeight: 600 }} />
      ) : (
        <Typography variant="body1" fontWeight={500}>
          {value || '—'}
        </Typography>
      )}
    </Box>
  </Box>
);

// Item Row with AI indicator
const ItemRow = ({ item, index }) => {
  const isEstimated = item.isEstimated;
  
  return (
    <TableRow
      sx={{
        '&:nth-of-type(odd)': { bgcolor: alpha('#2A3A68', 0.02) },
        '&:hover': { bgcolor: alpha('#FF8C42', 0.08) },
        transition: 'background-color 0.2s',
      }}
    >
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight={500}>
            {item.name}
          </Typography>
          {isEstimated && (
            <Tooltip title="AI Estimated - This item was guessed by AI" arrow>
              <Chip
                icon={<AiIcon sx={{ fontSize: 14 }} />}
                label="AI Guess"
                size="small"
                sx={{
                  bgcolor: alpha('#9C27B0', 0.1),
                  color: '#9C27B0',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  '& .MuiChip-icon': { color: '#9C27B0' },
                }}
              />
            </Tooltip>
          )}
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{item.quantity ?? 1}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatCurrency(item.unitPrice)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>
          {formatCurrency(item.totalPrice)}
        </Typography>
      </TableCell>
      <TableCell>
        {item.category && (
          <Chip
            label={item.category}
            size="small"
            sx={{
              bgcolor: alpha('#FF8C42', 0.15),
              color: '#FF8C42',
              fontWeight: 500,
              fontSize: '0.7rem',
            }}
          />
        )}
      </TableCell>
    </TableRow>
  );
};

// Main Content Component
const ReceiptShowContent = () => {
  const record = useRecordContext();
  
  if (!record) return null;

  const items = record.items || [];
  const hasEstimatedItems = items.some(item => item.isEstimated);
  
  // Calculate time difference between transaction and receipt
  const transactionDate = record.transactionDate ? new Date(record.transactionDate) : null;
  const receivedDate = record.receivedAt ? new Date(record.receivedAt) : (record.createdAt ? new Date(record.createdAt) : null);
  const timeDiffMs = transactionDate && receivedDate ? receivedDate - transactionDate : null;
  const timeDiffDays = timeDiffMs ? Math.floor(timeDiffMs / (1000 * 60 * 60 * 24)) : null;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Card */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #2A3A68 0%, #3D5291 100%)',
          color: '#fff',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#FF8C42',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              {record.storeName?.charAt(0).toUpperCase() || 'R'}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Patrick Hand", cursive' }}>
                {record.storeName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {record.storeLocation || 'Location not specified'}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip
              label={record.source}
              sx={{ bgcolor: '#FF8C42', color: '#fff', fontWeight: 600 }}
            />
            <Chip
              label={record.status}
              sx={{
                bgcolor: record.status === 'completed' ? '#4CAF50' : '#FFC107',
                color: '#fff',
                fontWeight: 600,
              }}
            />
            <Chip
              label={record.type || 'EXPENSE'}
              sx={{
                bgcolor: record.type === 'INCOME' ? '#4CAF50' : alpha('#fff', 0.2),
                color: '#fff',
                fontWeight: 600,
              }}
            />
            {hasEstimatedItems && (
              <Chip
                icon={<AiIcon sx={{ color: '#fff !important' }} />}
                label="Contains AI Estimates"
                sx={{ bgcolor: '#9C27B0', color: '#fff', fontWeight: 600 }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} color="primary">
                📋 Receipt Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoRow
                icon={<CalendarIcon fontSize="small" />}
                label="Transaction Date"
                value={formatDate(record.transactionDate)}
              />

              <InfoRow
                icon={<UploadIcon fontSize="small" />}
                label="Received / Uploaded"
                value={
                  <Stack>
                    <span>{formatDateTime(record.receivedAt || record.createdAt)}</span>
                    {timeDiffDays !== null && timeDiffDays > 0 && (
                      <Typography variant="caption" color="warning.main">
                        ⏱️ {timeDiffDays} day{timeDiffDays > 1 ? 's' : ''} after transaction
                      </Typography>
                    )}
                  </Stack>
                }
              />

              <InfoRow
                icon={<MoneyIcon fontSize="small" />}
                label="Total Amount"
                value={formatCurrency(record.totalAmount, record.currency)}
              />

              <InfoRow
                icon={<TagIcon fontSize="small" />}
                label="Tax"
                value={formatCurrency(record.taxAmount, record.currency)}
              />

              <InfoRow
                icon={<CategoryIcon fontSize="small" />}
                label="Category"
                value={record.category}
                chip
                chipColor="secondary"
              />

              {record.distanceKm && (
                <InfoRow
                  icon={<LocationIcon fontSize="small" />}
                  label="Distance"
                  value={`${record.distanceKm} km`}
                />
              )}

              {record.fileUrl && (
                <InfoRow
                  icon={<LinkIcon fontSize="small" />}
                  label="Archive Link"
                  value={
                    <a
                      href={record.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2A3A68', fontWeight: 500 }}
                    >
                      View Original
                    </a>
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Items */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} color="primary">
                  🛒 Items ({items.length})
                </Typography>
                {hasEstimatedItems && (
                  <Tooltip title="Some items were estimated by AI because they couldn't be clearly read from the receipt">
                    <Chip
                      icon={<AiIcon />}
                      label="AI Estimates Included"
                      size="small"
                      sx={{ bgcolor: alpha('#9C27B0', 0.1), color: '#9C27B0' }}
                    />
                  </Tooltip>
                )}
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {items.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#2A3A68', 0.05) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <ItemRow key={item.id || index} item={item} index={index} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: alpha('#2A3A68', 0.03),
                    borderRadius: 2,
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    No items recorded for this receipt
                  </Typography>
                </Box>
              )}

              {/* Summary */}
              {items.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alpha('#FF8C42', 0.08),
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Subtotal ({items.length} items)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="secondary">
                    {formatCurrency(record.totalAmount, record.currency)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const ReceiptShow = (props) => (
  <Show {...props} component="div">
    <ReceiptShowContent />
  </Show>
);
