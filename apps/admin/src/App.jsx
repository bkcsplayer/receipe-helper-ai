import { Admin, Resource, Layout, AppBar, Menu, useResourceDefinitions } from 'react-admin';
import { 
  CssBaseline, 
  createTheme, 
  ThemeProvider, 
  Box, 
  Typography, 
  Avatar,
  alpha,
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Receipt as ReceiptIcon,
  AutoAwesome,
} from '@mui/icons-material';
import { dataProvider } from './dataProvider';
import { ReceiptList } from './components/ReceiptList';
import { ReceiptShow } from './components/ReceiptShow';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';

// Custom AppBar with beautiful gradient
const MyAppBar = (props) => (
  <AppBar 
    {...props} 
    sx={{ 
      background: 'linear-gradient(135deg, #2A3A68 0%, #1a2744 100%)',
      boxShadow: '0 4px 20px rgba(42, 58, 104, 0.15)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      flex: 1,
      py: 0.5,
    }}>
      <Avatar 
        sx={{ 
          bgcolor: '#FF8C42', 
          width: 36, 
          height: 36,
          fontSize: '1.2rem',
          boxShadow: '0 2px 8px rgba(255, 140, 66, 0.4)',
        }}
      >
        💰
      </Avatar>
      <Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: '"Patrick Hand", cursive',
            fontSize: '1.4rem',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#fff',
          }}
        >
          Future Frontier
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            opacity: 0.7,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Admin Console
        </Typography>
      </Box>
    </Box>
  </AppBar>
);

// Custom Menu with icons
const MyMenu = () => {
  const resources = useResourceDefinitions();
  return (
    <Menu>
      <Menu.DashboardItem 
        leftIcon={<DashboardIcon />}
        primaryText="Dashboard"
      />
      <Menu.ResourceItem 
        name="receipts" 
        leftIcon={<ReceiptIcon />}
        primaryText="Receipts"
      />
    </Menu>
  );
};

// Custom Layout with sidebar
const MyLayout = (props) => (
  <Layout 
    {...props} 
    appBar={MyAppBar}
    menu={MyMenu}
    sx={{
      '& .RaLayout-content': {
        backgroundColor: '#F8F4EC',
        backgroundImage: `
          radial-gradient(at 20% 30%, rgba(42, 58, 104, 0.02) 0%, transparent 50%),
          radial-gradient(at 80% 70%, rgba(255, 140, 66, 0.02) 0%, transparent 50%)
        `,
        minHeight: '100vh',
      },
      '& .RaSidebar-fixed': {
        backgroundColor: '#fff',
        borderRight: '1px solid',
        borderColor: 'divider',
      },
      '& .RaMenuItemLink-active': {
        backgroundColor: alpha('#FF8C42', 0.1),
        borderLeft: '3px solid #FF8C42',
        color: '#FF8C42',
        fontWeight: 600,
        '& .MuiSvgIcon-root': {
          color: '#FF8C42',
        },
      },
    }}
  />
);

// Beautiful theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F8F4EC',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#2A3A68',
      light: '#3D5291',
      dark: '#1a2744',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF8C42',
      light: '#FFA76C',
      dark: '#E67730',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    text: {
      primary: '#4E3B31',
      secondary: 'rgba(78, 59, 49, 0.7)',
      disabled: 'rgba(78, 59, 49, 0.4)',
    },
    divider: 'rgba(42, 58, 104, 0.08)',
  },
  typography: {
    fontFamily: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
    h1: { fontFamily: '"Patrick Hand", cursive', fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontFamily: '"Patrick Hand", cursive', fontWeight: 700, letterSpacing: '-0.5px' },
    h3: { fontFamily: '"Patrick Hand", cursive', fontWeight: 600, letterSpacing: '-0.25px' },
    h4: { fontFamily: '"Patrick Hand", cursive', fontWeight: 600, letterSpacing: '-0.25px' },
    h5: { fontFamily: '"Patrick Hand", cursive', fontWeight: 500 },
    h6: { fontFamily: '"Inter"', fontWeight: 700, letterSpacing: '0.15px' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.5px' },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.25px' },
    caption: { fontWeight: 500, letterSpacing: '0.4px' },
    overline: { fontWeight: 700, letterSpacing: '1.5px' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(42, 58, 104, 0.06)',
    '0 2px 6px rgba(42, 58, 104, 0.08)',
    '0 4px 12px rgba(42, 58, 104, 0.1)',
    '0 6px 16px rgba(42, 58, 104, 0.12)',
    '0 8px 20px rgba(42, 58, 104, 0.14)',
    '0 10px 24px rgba(42, 58, 104, 0.16)',
    '0 12px 28px rgba(42, 58, 104, 0.18)',
    '0 14px 32px rgba(42, 58, 104, 0.2)',
    '0 16px 36px rgba(42, 58, 104, 0.22)',
    '0 18px 40px rgba(42, 58, 104, 0.24)',
    '0 20px 44px rgba(42, 58, 104, 0.26)',
    '0 22px 48px rgba(42, 58, 104, 0.28)',
    '0 24px 52px rgba(42, 58, 104, 0.3)',
    '0 26px 56px rgba(42, 58, 104, 0.32)',
    '0 28px 60px rgba(42, 58, 104, 0.34)',
    '0 30px 64px rgba(42, 58, 104, 0.36)',
    '0 32px 68px rgba(42, 58, 104, 0.38)',
    '0 34px 72px rgba(42, 58, 104, 0.4)',
    '0 36px 76px rgba(42, 58, 104, 0.42)',
    '0 38px 80px rgba(42, 58, 104, 0.44)',
    '0 40px 84px rgba(42, 58, 104, 0.46)',
    '0 42px 88px rgba(42, 58, 104, 0.48)',
    '0 44px 92px rgba(42, 58, 104, 0.5)',
    '0 46px 96px rgba(42, 58, 104, 0.52)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8F4EC',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(42, 58, 104, 0.06)',
          border: '1px solid rgba(42, 58, 104, 0.06)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(42, 58, 104, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(42, 58, 104, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(42, 58, 104, 0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(42, 58, 104, 0.2)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(255, 140, 66, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(42, 58, 104, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(42, 58, 104, 0.06)',
        },
        head: {
          fontWeight: 700,
          backgroundColor: alpha('#2A3A68', 0.03),
          color: '#2A3A68',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: alpha('#FF8C42', 0.04),
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(42, 58, 104, 0.08)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(255, 140, 66, 0.15)',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2A3A68',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(42, 58, 104, 0.2)',
        },
        arrow: {
          color: '#2A3A68',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(42, 58, 104, 0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Admin 
        dataProvider={dataProvider} 
        dashboard={OverviewDashboard} 
        layout={MyLayout}
        title="Future Frontier Admin"
      >
        <Resource 
          name="receipts" 
          list={ReceiptList} 
          show={ReceiptShow} 
          recordRepresentation="storeName"
          icon={ReceiptIcon}
        />
      </Admin>
    </ThemeProvider>
  );
}

export default App;
