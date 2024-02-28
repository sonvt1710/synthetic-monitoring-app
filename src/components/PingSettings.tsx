import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Select, Switch } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesPing } from 'types';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

import { IP_OPTIONS } from './constants';

interface Props {
  isEditor: boolean;
}

export const PingSettingsForm = ({ isEditor }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { control, register } = useFormContext<CheckFormValuesPing>();

  return (
    <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
      <div
        className={css`
          max-width: 500px;
        `}
      >
        <LabelField<CheckFormValuesPing> isEditor={isEditor} />
        <Field label="IP version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
          <Controller<CheckFormValuesPing>
            name="settings.ping.ipVersion"
            control={control}
            render={({ field }) => {
              const { ref, ...rest } = field;
              return <Select {...rest} options={IP_OPTIONS} />;
            }}
            rules={{ required: true }}
          />
        </Field>
        <Field
          label="Don't fragment"
          description="Set the DF-bit in the IP-header. Only works with ipV4"
          disabled={!isEditor}
        >
          <Switch id="ping-settings-dont-fragment" {...register('settings.ping.dontFragment')} disabled={!isEditor} />
        </Field>
      </div>
    </Collapse>
  );
};
