import { List, Datagrid, TextField, DateField, NumberField, TextInput, FunctionField } from 'react-admin';
import { Chip, Stack } from '@mui/material';

const receiptFilters = [
  <TextInput key="month" source="month" label="Month (YYYY-MM)" alwaysOn />,
  <TextInput key="category" source="category" label="Category" />
];

const StatusChip = ({ record }) => {
  if (!record) return null;
  const color = record.status === 'completed' ? 'success' : 'warning';
  return <Chip label={record.status} color={color} size="small" />;
};

const SourceChip = ({ record }) => {
  if (!record) return null;
  return (
    <Chip
      label={record.source}
      size="small"
      sx={{ textTransform: 'capitalize', backgroundColor: '#ffe7d1', borderRadius: '8px' }}
    />
  );
};

export const ReceiptList = (props) => (
  <List {...props} perPage={25} sort={{ field: 'transactionDate', order: 'DESC' }} filters={receiptFilters}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <DateField source="transactionDate" label="Date" />
      <TextField source="storeName" label="Store" />
      <TextField source="storeLocation" label="Location" />
      <NumberField source="totalAmount" label="Total" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="category" />
      <FunctionField
        label="Status"
        render={(record) => (
          <Stack direction="row" spacing={1}>
            <SourceChip record={record} />
            <StatusChip record={record} />
          </Stack>
        )}
      />
    </Datagrid>
  </List>
);

