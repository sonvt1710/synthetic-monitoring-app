import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { TextLink } from '@grafana/ui';

import { CheckFormPageParams, ROUTES } from 'types';
import { CHECK_TYPE_GROUP_OPTIONS } from 'hooks/useCheckTypeGroupOptions';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { getRoute } from 'components/Routing.utils';

import { PluginPageNotFound } from '../NotFound/NotFound';

export const NewCheck = () => {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const group = CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup);

  if (!group) {
    return (
      <PluginPageNotFound breadcrumb="New check" message="Page not found">
        <div>
          <div>We&apos;re unable to find a check type that corresponds to the current URL.</div>
          <div>
            Are you trying to <TextLink href={getRoute(ROUTES.ChooseCheckGroup)}>create a new check</TextLink>?
          </div>
        </div>
      </PluginPageNotFound>
    );
  }

  return <CheckForm />;
};
