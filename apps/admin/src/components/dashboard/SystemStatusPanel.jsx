/**
 * System Status Panel
 * 
 * Displays real-time system status including:
 * - Integration status (R2, Drive, Sheets, Email, Telegram, AI)
 * - Data flow visualization
 * - AI token usage tracking
 * - Mock data management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Stack, Chip, Avatar, Button,
  LinearProgress, Divider, IconButton, Alert, Tooltip, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import {
  Cloud, Storage, Email, Send, SmartToy, CheckCircle, Error,
  Refresh, Delete, Add, Timeline, DataUsage, Memory, Speed,
  CloudUpload, TableChart, Telegram, CreditCard, Receipt,
  ArrowForward, Circle, AccountTree,
} from '@mui/icons-material';
import { apiClient } from '../../lib/api';

// Status indicator component
const StatusIndicator = ({ status, label }) => {
  const isOk = status === true || status === 'connected' || status === 'running';
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Circle sx={{ fontSize: 10, color: isOk ? '#4CAF50' : '#F44336' }} />
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Stack>
  );
};

// Integration card component
const IntegrationCard = ({ icon: Icon, name, enabled, details, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: enabled ? 'success.light' : 'error.light',
      bgcolor: enabled ? 'success.50' : 'error.50',
      opacity: enabled ? 1 : 0.7,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={2}>
      <Avatar sx={{ bgcolor: enabled ? color : 'grey.400', width: 40, height: 40 }}>
        <Icon fontSize="small" />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>{name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {enabled ? (details || 'Connected') : 'Not configured'}
        </Typography>
      </Box>
      {enabled ? (
        <CheckCircle sx={{ color: 'success.main' }} />
      ) : (
        <Error sx={{ color: 'error.main' }} />
      )}
    </Stack>
  </Paper>
);

// Data flow node component
const FlowNode = ({ icon: Icon, label, count, color, active }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      borderRadius: 2,
      border: '2px solid',
      borderColor: active ? color : 'grey.300',
      textAlign: 'center',
      minWidth: 80,
      bgcolor: active ? `${color}15` : 'grey.50',
    }}
  >
    <Icon sx={{ fontSize: 24, color: active ? color : 'grey.400', mb: 0.5 }} />
    <Typography variant="caption" display="block" fontWeight={600}>
      {label}
    </Typography>
    {count !== undefined && (
      <Chip label={count} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
    )}
  </Paper>
);

// Arrow connector
const FlowArrow = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
    <ArrowForward sx={{ color: 'grey.400' }} />
  </Box>
);

export const SystemStatusPanel = () => {
  const [status, setStatus] = useState(null);
  const [mockDataStatus, setMockDataStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [systemRes, mockRes] = await Promise.all([
        apiClient.get('/api/v2/system/status'),
        apiClient.get('/api/v2/mock-data/status'),
      ]);
      setStatus(systemRes.data);
      setMockDataStatus(mockRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle mock data actions
  const handleMockDataAction = async (action) => {
    setConfirmDialog({ open: false, action: null });
    setActionLoading(action);
    try {
      if (action === 'seed') {
        await apiClient.post('/api/v2/mock-data/seed');
      } else if (action === 'delete') {
        await apiClient.delete('/api/v2/mock-data');
      }
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !status) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading system status...</Typography>
      </Box>
    );
  }

  const integrations = status?.integrations || {};
  const dataFlow = status?.dataFlow || {};

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          🖥️ System Status
        </Typography>
        <IconButton onClick={fetchStatus} disabled={loading}>
          <Refresh className={loading ? 'fa-spin' : ''} />
        </IconButton>
      </Stack>

      {/* Server Status */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Storage />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Server Status</Typography>
            <StatusIndicator status={status?.server?.status} label={`Port ${status?.server?.port || 3001}`} />
          </Box>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={`Uptime: ${Math.floor((status?.server?.uptime || 0) / 3600)}h ${Math.floor(((status?.server?.uptime || 0) % 3600) / 60)}m`}
            size="small"
            color="success"
          />
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Memory sx={{ color: 'primary.main' }} />
              <Typography variant="caption" display="block">Memory</Typography>
              <Typography variant="body2" fontWeight={600}>
                {Math.round((status?.server?.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <DataUsage sx={{ color: 'secondary.main' }} />
              <Typography variant="caption" display="block">Database</Typography>
              <Typography variant="body2" fontWeight={600}>{status?.database?.status || 'Unknown'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <SmartToy sx={{ color: 'warning.main' }} />
              <Typography variant="caption" display="block">AI Calls</Typography>
              <Typography variant="body2" fontWeight={600}>{status?.ai?.totalCalls || 0}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Speed sx={{ color: 'info.main' }} />
              <Typography variant="caption" display="block">Tokens Used</Typography>
              <Typography variant="body2" fontWeight={600}>{(status?.ai?.totalTokens || 0).toLocaleString()}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Integrations Grid */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        🔌 Integrations
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={Cloud}
            name="Cloudflare R2"
            enabled={integrations.cloudflareR2?.enabled}
            details={integrations.cloudflareR2?.bucket}
            color="#F38020"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={CloudUpload}
            name="Google Drive"
            enabled={integrations.googleDrive?.enabled}
            color="#4285F4"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={TableChart}
            name="Google Sheets"
            enabled={integrations.googleSheets?.enabled}
            color="#0F9D58"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={Email}
            name="Email Inbox"
            enabled={integrations.email?.enabled}
            details={integrations.email?.inboxEmail}
            color="#EA4335"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={Telegram}
            name="Telegram"
            enabled={integrations.telegram?.enabled}
            color="#0088CC"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <IntegrationCard
            icon={SmartToy}
            name="OpenRouter AI"
            enabled={integrations.openRouter?.enabled}
            details={integrations.openRouter?.model}
            color="#9C27B0"
          />
        </Grid>
      </Grid>

      {/* Data Flow Visualization */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        📊 Data Flow Pipeline
      </Typography>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ minWidth: 600 }}>
          <FlowNode
            icon={Email}
            label="Email"
            count={dataFlow.sources?.find(s => s.source === 'EMAIL')?._count || 0}
            color="#EA4335"
            active={integrations.email?.enabled}
          />
          <FlowArrow />
          <FlowNode
            icon={CloudUpload}
            label="Upload"
            count={dataFlow.sources?.find(s => s.source === 'WEB')?._count || 0}
            color="#4285F4"
            active={true}
          />
          <FlowArrow />
          <FlowNode
            icon={SmartToy}
            label="AI OCR"
            color="#9C27B0"
            active={integrations.openRouter?.enabled}
          />
          <FlowArrow />
          <FlowNode
            icon={Storage}
            label="Database"
            count={mockDataStatus?.totalCount || 0}
            color="#2A3A68"
            active={status?.database?.status === 'connected'}
          />
          <FlowArrow />
          <FlowNode
            icon={Cloud}
            label="R2 Archive"
            color="#F38020"
            active={integrations.cloudflareR2?.enabled}
          />
        </Stack>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Second flow: Analysis */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <FlowNode
            icon={Receipt}
            label="Receipts"
            color="#2A3A68"
            active={true}
          />
          <FlowArrow />
          <FlowNode
            icon={SmartToy}
            label="AI Analysis"
            color="#9C27B0"
            active={integrations.openRouter?.enabled}
          />
          <FlowArrow />
          <FlowNode
            icon={Timeline}
            label="Insights"
            color="#FF8C42"
            active={true}
          />
          <FlowArrow />
          <FlowNode
            icon={Send}
            label="Email Report"
            color="#0F9D58"
            active={integrations.email?.enabled}
          />
        </Stack>
      </Paper>

      {/* Mock Data Management */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        🧪 Test Data Management
      </Typography>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Mock data allows you to test the system without real receipts.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  icon={<Receipt />}
                  label={`Mock: ${mockDataStatus?.mockDataCount || 0}`}
                  color={mockDataStatus?.hasMockData ? 'warning' : 'default'}
                  variant="outlined"
                />
                <Chip
                  icon={<CreditCard />}
                  label={`Real: ${mockDataStatus?.realDataCount || 0}`}
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={actionLoading === 'seed' ? <CircularProgress size={16} /> : <Add />}
                onClick={() => setConfirmDialog({ open: true, action: 'seed' })}
                disabled={actionLoading !== null}
              >
                Add Mock Data
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={actionLoading === 'delete' ? <CircularProgress size={16} /> : <Delete />}
                onClick={() => setConfirmDialog({ open: true, action: 'delete' })}
                disabled={actionLoading !== null || !mockDataStatus?.hasMockData}
              >
                Delete Mock Data
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity */}
      {dataFlow.recentActivity?.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
            📋 Recent Activity
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {dataFlow.recentActivity.map((item, idx) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: idx < dataFlow.recentActivity.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', mr: 2 }}>
                  <Receipt fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>{item.storeName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip label={item.source} size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  ${parseFloat(item.totalAmount).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null })}>
        <DialogTitle>
          {confirmDialog.action === 'seed' ? '🌱 Add Mock Data' : '🗑️ Delete Mock Data'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'seed'
              ? 'This will generate 3 months of realistic test data including paychecks, bills, and various expenses. Continue?'
              : `This will permanently delete ${mockDataStatus?.mockDataCount || 0} mock receipts. Your real data will not be affected. Continue?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'seed' ? 'primary' : 'error'}
            onClick={() => handleMockDataAction(confirmDialog.action)}
          >
            {confirmDialog.action === 'seed' ? 'Generate Data' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

