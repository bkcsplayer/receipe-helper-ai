import { fetchUtils } from 'react-admin';
import { API_BASE_URL } from './lib/api';

const httpClient = fetchUtils.fetchJson;

const receiptsAdapter = async (params) => {
  const { page, perPage } = params.pagination;
  const { field, order } = params.sort;
  const { month, category } = params.filter || {};

  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: perPage.toString()
  });
  if (month) query.set('month', month);
  if (category) query.set('category', category);
  if (field && order) {
    query.set('sort', `${field}:${order}`);
  }

  const { json } = await httpClient(`${API_BASE_URL}/api/v2/receipts?${query.toString()}`);
  return {
    data: (json.data || []).map((record) => ({ id: record.id, ...record })),
    total: json.total || 0
  };
};

const receiptOneAdapter = async (id) => {
  const { json } = await httpClient(`${API_BASE_URL}/api/v2/receipts/${id}`);
  return { data: { id: json.id, ...json } };
};

const unsupported = (method) => () => Promise.reject(`${method} is not implemented in this data provider`);

export const dataProvider = {
  getList: (resource, params) => {
    if (resource === 'receipts') {
      return receiptsAdapter(params);
    }
    return unsupported('getList')();
  },
  getOne: (resource, params) => {
    if (resource === 'receipts') {
      return receiptOneAdapter(params.id);
    }
    return unsupported('getOne')();
  },
  getMany: (resource, params) => {
    if (resource === 'receipts') {
      return Promise.all(params.ids.map((id) => receiptOneAdapter(id))).then((responses) => ({
        data: responses.map((res) => res.data)
      }));
    }
    return unsupported('getMany')();
  },
  getManyReference: unsupported('getManyReference'),
  update: unsupported('update'),
  updateMany: unsupported('updateMany'),
  create: unsupported('create'),
  delete: unsupported('delete'),
  deleteMany: unsupported('deleteMany')
};

