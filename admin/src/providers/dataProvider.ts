import {
  DataProvider,
  Pagination,
  CrudSorting,
  CrudFilters,
  CrudOperators,
} from '@refinedev/core';
import stringify from 'query-string';
import { AxiosInstance } from 'axios';
import axiosInstance from '../axios';
import { transformers } from '@/constants';

type MethodTypes = 'get' | 'delete' | 'head' | 'options';
type MethodTypesWithBody = 'post' | 'put' | 'patch';

// Resource mapping - maps frontend resource names to API endpoints
const resourceMapping: Record<string, string> = {
  students: 'students',
  tests: 'tests',
};

const getApiResource = (resource: string): string => {
  return resourceMapping[resource] || resource;
};

export const dataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance
): DataProvider => ({
  getOne: async ({ resource, id, meta }) => {
    const apiResource = getApiResource(resource);
    const url = `${apiUrl}/${apiResource}/${id}/`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypes) ?? 'get';

    let { data } = await httpClient[requestMethod](url, { headers });

    const transform: true | undefined | ((data: any) => any) = meta?.transform;

    if (transform === true && transformers[resource]) {
      data = transformers[resource](data);
    } else if (typeof transform === 'function') {
      data = transform(data);
    }

    return {
      data,
    };
  },

  update: async ({ resource, id, variables, meta }) => {
    const apiResource = getApiResource(resource);
    const url = `${apiUrl}/${apiResource}/${id}/`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? 'patch';

    const { data } = await httpClient[requestMethod](url, variables, {
      headers,
    });

    return {
      data,
    };
  },

  create: async ({ resource, variables, meta }) => {
    const apiResource = getApiResource(resource);
    const url = `${apiUrl}/${apiResource}/`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? 'post';

    const { data } = await httpClient[requestMethod](url, variables, {
      headers,
    });

    return {
      data,
    };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const apiResource = getApiResource(resource);
    const url = `${apiUrl}/${apiResource}/${id}/`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? 'delete';

    const { data } = await httpClient[requestMethod](url, {
      data: variables,
      headers,
    });

    return {
      data,
    };
  },

  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const apiResource = getApiResource(resource);
    const url = `${apiUrl}/${apiResource}/`;

    const { headers: headersFromMeta, method } = meta ?? {};
    const requestMethod = (method as MethodTypes) ?? 'get';

    // init query object for pagination and sorting
    const query: {
      _start?: number;
      _end?: number;
      _sort?: string;
      _order?: string;
    } = {};

    const generatedPagination = generatePagination(pagination);
    if (generatedPagination) {
      const { _start, _end } = generatedPagination;
      query._start = _start;
      query._end = _end;
    }

    const generatedSort = generateSort(sorters);
    if (generatedSort) {
      const { _sort, _order } = generatedSort;
      query._sort = _sort.join(',');
      query._order = _order.join(',');
    }

    const queryFilters = generateFilter(filters);

    const response = await httpClient[requestMethod](
      `${url}?${stringify.stringify(query)}&${stringify.stringify(
        queryFilters
      )}`,
      {
        headers: headersFromMeta,
      }
    );

    const { headers } = response;
    let { data } = response;

    const total = +headers['x-total-count'];

    const transform: true | undefined | ((data: any) => any) = meta?.transform;

    if (transform === true && transformers[resource]) {
      data = data.results.map(transformers[resource]);
    } else if (typeof transform === 'function') {
      data = data.results.map(transform);
    } else {
      data = data.results;
    }

    return {
      data: data,
      total: total || data.length,
    };
  },

  custom: async ({
    url,
    method,
    filters,
    sorters,
    payload,
    query,
    headers,
    meta,
  }) => {
    const queryParams: {
      _sort?: string;
      _order?: string;
      [key: string]: string | number | boolean | undefined;
    } = { ...query };

    console.log(sorters);
    console.log(filters);
    console.log(payload);
    console.log(query);
    console.log(headers);
    console.log(url);
    console.log(method);

    const generatedSort = generateSort(sorters);
    if (generatedSort) {
      const { _sort, _order } = generatedSort;
      queryParams._sort = _sort.join(',');
      queryParams._order = _order.join(',');
    }

    const queryFilters = generateFilter(filters);
    let queryString = '';
    if (Object.keys(queryParams).length > 0) {
      queryString += `?${stringify.stringify(queryParams)}`;
    }
    if (Object.keys(queryFilters).length > 0) {
      if (queryString) {
        queryString += `&${stringify.stringify(queryFilters)}`;
      } else {
        queryString += `?${stringify.stringify(queryFilters)}`;
      }
    }

    if (['post', 'put', 'patch'].includes(method)) {
      const { data: responseData } = await httpClient[method](
        `${url}${queryString}`,
        // @ts-expect-error - payload is not always required
        payload,
        {
          headers,
        }
      );

      const transform: undefined | ((data: any) => any) = meta?.transform;
      if (typeof transform === 'function') {
        const data = transform(responseData);
        return { data };
      }

      return { data: responseData };
    } else {
      const { data: responseData } = await httpClient[method](
        `${url}${queryString}`,
        {
          headers,
        }
      );

      const transform: undefined | ((data: any) => any) = meta?.transform;
      if (typeof transform === 'function') {
        const data = transform(responseData);
        return { data };
      }

      return { data: responseData };
    }
  },

  getApiUrl: () => apiUrl,
});

// convert Refine CrudOperators to the format that API accepts.
const mapOperator = (operator: CrudOperators): string => {
  switch (operator) {
    case 'ne':
    case 'gte':
    case 'lte':
      return `_${operator}`;
    case 'contains':
      return '_like';
    case 'eq':
    default:
      return '';
  }
};

// generate query string from Refine CrudFilters to the format that API accepts.
const generateFilter = (filters?: CrudFilters) => {
  const queryFilters: { [key: string]: string } = {};

  if (filters) {
    filters.map(filter => {
      if (filter.operator === 'or' || filter.operator === 'and') {
        throw new Error(
          `[@refinedev/simple-rest]: /docs/data/data-provider#creating-a-data-provider`
        );
      }

      if ('field' in filter) {
        const { field, operator, value } = filter;

        if (field === 'q') {
          queryFilters[field] = value;
          return;
        }

        const mappedOperator = mapOperator(operator);
        queryFilters[`${_camelToSnake(field)}${mappedOperator}`] = value;
      }
    });
  }

  return queryFilters;
};

const _camelToSnake = (str: string) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

// generate query string from Refine CrudSorting to the format that API accepts.
const generateSort = (sorters?: CrudSorting) => {
  if (sorters && sorters.length > 0) {
    const _sort: string[] = [];
    const _order: string[] = [];

    sorters.map(item => {
      _sort.push(_camelToSnake(item.field));
      _order.push(item.order);
    });

    return {
      _sort,
      _order,
    };
  }

  return;
};

// generate query string from Refine Pagination to the format that API accepts.
const generatePagination = (pagination?: Pagination) => {
  // pagination is optional on data hooks, so we need to set default values.
  const { current = 1, pageSize = 10, mode = 'server' } = pagination ?? {};

  const query: {
    _start?: number;
    _end?: number;
  } = {};

  if (mode === 'server') {
    query._start = (current - 1) * pageSize;
    query._end = current * pageSize;
  }

  return query;
};
