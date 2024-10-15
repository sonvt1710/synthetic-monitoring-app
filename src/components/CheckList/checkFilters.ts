import { SelectableValue } from '@grafana/data';

import { Check, CheckEnabledStatus, CheckFiltersType, CheckTypeFilter } from 'types';
import { getCheckType, matchStrings } from 'utils';

const matchesFilterType = (check: Check, typeFilter: CheckTypeFilter) => {
  if (typeFilter === 'all') {
    return true;
  }

  const checkType = getCheckType(check.settings);

  return checkType === typeFilter;
};

const matchesSearchFilter = ({ target, job, labels }: Check, searchFilter: string) => {
  if (!searchFilter) {
    return true;
  }

  // allow users to search using <term>=<somevalue>.
  // <term> can be one of target, job or a label name
  const filterParts = searchFilter.toLowerCase().trim().split('=');

  const labelMatches = labels.reduce((acc, { name, value }) => {
    acc.push(name);
    acc.push(value);
    return acc;
  }, [] as string[]);

  return filterParts.some((filterPart) => matchStrings(filterPart, [target, job, ...labelMatches]));
};

const matchesLabelFilter = ({ labels }: Check, labelFilters: string[]) => {
  if (!labelFilters || labelFilters.length === 0) {
    return true;
  }

  return labels?.some(({ name, value }) => {
    return labelFilters.some((filter) => filter === `${name}: ${value}`);
  });
};

const matchesStatusFilter = ({ enabled }: Check, { value }: SelectableValue) => {
  return (
    value === CheckEnabledStatus.All ||
    (value === CheckEnabledStatus.Enabled && enabled) ||
    (value === CheckEnabledStatus.Disabled && !enabled)
  );
};

const matchesSelectedProbes = (check: Check, selectedProbes: SelectableValue[]) => {
  if (selectedProbes.length === 0) {
    return true;
  }

  const probeIds = selectedProbes.map((p) => p.value);

  return check.probes.some((id) => probeIds.includes(id));
};

export const matchesAllFilters = (check: Check, checkFilters: CheckFiltersType) => {
  const { type, search, labels, status, probes } = checkFilters;

  return (
    Boolean(check.id) &&
    matchesFilterType(check, type) &&
    matchesSearchFilter(check, search) &&
    matchesLabelFilter(check, labels) &&
    matchesStatusFilter(check, status) &&
    matchesSelectedProbes(check, probes)
  );
};
