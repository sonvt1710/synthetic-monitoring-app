import React from 'react';

import { css } from '@emotion/css';
import { Card, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { CheckType, FeatureName, ROUTES } from 'types';
import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';

export function ChooseCheckType() {
  const styles = useStyles2(getStyles);
  const { isEnabled: tracerouteEnabled } = useFeatureFlag(FeatureName.Traceroute);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  // If we're editing, grab the appropriate check from the list
  const navigate = useNavigation();

  const options = CHECK_TYPE_OPTIONS.filter(({ value }) => {
    if (!tracerouteEnabled && value === CheckType.Traceroute) {
      return false;
    }
    if (!multiHttpEnabled && value === CheckType.MULTI_HTTP) {
      return false;
    }
    return true;
  });

  return (
    <PluginPage layout={PageLayoutType?.Standard} pageNav={{ text: 'Choose a check type', description: '' }}>
      <div className={styles.container}>
        {options?.map((check) => {
          return (
            <Card
              key={check?.label || ''}
              className={styles.cards}
              onClick={() => {
                navigate(`${ROUTES.NewCheck}/${check.value}`);
              }}
            >
              <Card.Heading className={styles.cardsHeader}>{check.label}</Card.Heading>
              <Card.Description>{check.description}</Card.Description>
            </Card>
          );
        })}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    margin: ${theme.spacing(2)} 0;
    padding: ${theme.spacing(2)};
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 400px));
    gap: ${theme.spacing(2)};
  `,
  cards: css`
    max-width: 400px;
  `,
  cardsHeader: css`
    text-align: center;
    justify-content: center;
    align-items: flex-start;
  `,
});
