import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  NumberField,
  ArrayField,
  Datagrid,
  ChipField
} from 'react-admin';

export const ReceiptShow = (props) => (
  <Show {...props}>
    <SimpleShowLayout>
      <DateField source="transactionDate" label="Date" />
      <TextField source="storeName" label="Store" />
      <TextField source="storeLocation" label="Location" />
      <TextField source="source" label="Source" />
      <TextField source="status" label="Status" />
      <NumberField source="totalAmount" label="Total Amount" options={{ style: 'currency', currency: 'USD' }} />
      <NumberField source="taxAmount" label="Tax" />
      <TextField source="fileUrl" label="Archive Link" />
      <ArrayField source="items">
        <Datagrid bulkActionButtons={false}>
          <TextField source="name" />
          <NumberField source="quantity" />
          <NumberField source="unitPrice" />
          <NumberField source="totalPrice" />
          <ChipField source="category" />
        </Datagrid>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);

