import { Admin, Resource } from 'react-admin';
import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { dataProvider } from './dataProvider';
import { ReceiptList } from './components/ReceiptList';
import { ReceiptShow } from './components/ReceiptShow';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';

const theme = createTheme({
  palette: {
    background: {
      default: '#f8f4ec'
    },
    primary: {
      main: '#2A3A68'
    },
    secondary: {
      main: '#FF8C42'
    }
  },
  typography: {
    fontFamily: ['"Inter"', 'sans-serif'].join(','),
    h6: {
      fontWeight: 600
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Admin dataProvider={dataProvider} dashboard={OverviewDashboard}>
        <Resource name="receipts" list={ReceiptList} show={ReceiptShow} recordRepresentation="storeName" />
      </Admin>
    </ThemeProvider>
  );
}

export default App;
