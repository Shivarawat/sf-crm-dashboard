// Builds the paginated, searchable list queries for each CRM object.
// Everything that reaches the SOQL string is either from the whitelists below or escaped.

const LIST_CONFIG = {
  accounts: {
    sobject: 'Account',
    fields: ['Id', 'Name', 'Industry', 'AnnualRevenue', 'Phone', 'Website', 'CreatedDate'],
    searchFields: ['Name', 'Industry'],
    sortFields: ['Name', 'Industry', 'AnnualRevenue', 'CreatedDate'],
  },
  contacts: {
    sobject: 'Contact',
    fields: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Account.Name', 'CreatedDate'],
    searchFields: ['Name', 'Email'],
    sortFields: ['LastName', 'Email', 'CreatedDate'],
  },
  opportunities: {
    sobject: 'Opportunity',
    fields: ['Id', 'Name', 'StageName', 'Amount', 'CloseDate', 'Account.Name', 'CreatedDate'],
    searchFields: ['Name', 'StageName'],
    sortFields: ['Name', 'StageName', 'Amount', 'CloseDate', 'CreatedDate'],
  },
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const MAX_OFFSET = 2000;   // Salesforce rejects OFFSET above 2000
const MAX_SEARCH_LENGTH = 100;

class QueryParamError extends Error {}

// Escape user text for use inside a SOQL LIKE '...' literal.
// Backslash and quote end the string; % and _ are LIKE wildcards.
function escapeLike(text) {
  return text.replace(/[\\'%_]/g, (ch) => `\\${ch}`);
}

// Turn ?limit=&offset=&search=&sort=&dir= into safe values (throws QueryParamError on bad input)
function parseListParams(query, config) {
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new QueryParamError(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
    throw new QueryParamError(`offset must be an integer between 0 and ${MAX_OFFSET}`);
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search.length > MAX_SEARCH_LENGTH) {
    throw new QueryParamError(`search must be at most ${MAX_SEARCH_LENGTH} characters`);
  }

  const sort = query.sort === undefined ? 'CreatedDate' : query.sort;
  if (!config.sortFields.includes(sort)) {
    throw new QueryParamError(`sort must be one of: ${config.sortFields.join(', ')}`);
  }
  const dir = (query.dir || 'DESC').toUpperCase();
  if (dir !== 'ASC' && dir !== 'DESC') throw new QueryParamError('dir must be ASC or DESC');

  return { limit, offset, search, sort, dir };
}

// Returns the page query and the matching COUNT() query
function buildListQueries(config, { limit, offset, search, sort, dir }) {
  const where = search
    ? ` WHERE (${config.searchFields.map((f) => `${f} LIKE '%${escapeLike(search)}%'`).join(' OR ')})`
    : '';
  // Id as a tie-breaker keeps the order stable, so rows don't jump between pages
  const nulls = dir === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';
  return {
    dataSoql: `SELECT ${config.fields.join(', ')} FROM ${config.sobject}${where} ORDER BY ${sort} ${dir} ${nulls}, Id ${dir} LIMIT ${limit} OFFSET ${offset}`,
    countSoql: `SELECT COUNT() FROM ${config.sobject}${where}`,
  };
}

module.exports = {
  LIST_CONFIG, DEFAULT_LIMIT, MAX_LIMIT, MAX_OFFSET,
  QueryParamError, escapeLike, parseListParams, buildListQueries,
};
