import React, { useContext, useState, useMemo, useCallback } from 'react';
import { FormProvider, useForm, Controller, useFieldArray } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import {
  Alert,
  Button,
  ConfirmModal,
  Field,
  LinkButton,
  VerticalGroup,
  Input,
  Select,
  useStyles2,
  Legend,
  HorizontalGroup,
} from '@grafana/ui';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from 'components/CheckEditor/checkFormTransformations';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { METHOD_OPTIONS } from 'components/constants';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import { multiHttpFallbackCheck } from './consts';
import { validateTarget } from 'validation';
import { TabSection } from './Tabs/TabSection';
import { getMultiHttpFormStyles } from './MultiHttpSettingsForm.styles';
import { CheckFormValues, Check, CheckPageParams, CheckType } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { PluginPage } from 'components/PluginPage';
import { config } from '@grafana/runtime';
import { OrgRole } from '@grafana/data';
import { hasRole } from 'utils';
import { AvailableVariables } from './AvailableVariables';

interface Props {
  checks?: Check[];
  onReturn?: (reload?: boolean) => void;
}

export const MultiHttpSettingsForm = ({ checks, onReturn }: Props) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const [urls, setUrls] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>();
  let check: Check = multiHttpFallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? multiHttpFallbackCheck;
  }
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);

  const formMethods = useForm<CheckFormValues>({ defaultValues, reValidateMode: 'onBlur' });

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'settings.multihttp.entries',
  });
  const isEditor = hasRole(OrgRole.Editor);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onSubmit = useCallback(
    async (values: CheckFormValues) => {
      // All other types of SM checks so far require a `target` to execute at the root of the submitted object.
      // This is not the case for multihttp checks, whose targets are called `url`s and are nested under
      // `settings.multihttp?.entries[0].request.url`. Yet, the BE still requires a root-level `target`, even in
      // the case of multihttp, even though it wont be used. So we will pass this safety `target`.values.target = target;
      const target = values.settings.multihttp?.entries?.[0]?.request?.url ?? '';
      if (!target) {
        throw new Error('At least one request with a URL is required');
      }

      const updatedCheck = getCheckFromFormValues(values, defaultValues, CheckType.MULTI_HTTP);

      try {
        if (check?.id) {
          // trackEvent('editCheckSubmit');
          await api?.updateCheck({
            id: check.id,
            tenantId: check.tenantId,
            ...updatedCheck,
          });
        } else {
          // trackEvent('addNewCheckSubmit');
          await api?.addCheck(updatedCheck);
        }
        onReturn && onReturn(true);
      } catch (err: any) {
        setErrorMessages([err?.data?.err || err?.data?.msg]);
      }
    },
    [api, onReturn, check.tenantId, check.id, setErrorMessages, defaultValues]
  );

  const clearAlert = () => {
    setErrorMessages([]);
  };

  const getErrorMessages = () => {
    return (
      errorMessages && (
        <Alert title="Multi-http request creation failed" severity="error" onRemove={clearAlert}>
          <>
            {errorMessages.map((ms, index) => {
              return <div key={index}>{ms}</div>;
            })}
          </>
        </Alert>
      )
    );
  };

  const onRemoveCheck = async () => {
    const id = check?.id;
    if (!id) {
      return;
    }
    await api?.deleteCheck(id);
    onReturn && onReturn(true);
  };

  return (
    <>
      <PluginPage pageNav={{ text: check?.job ? check.job : 'Add check', description: 'Check configuration' }}>
        {!config.featureToggles.topnav && <Legend>{check?.id ? 'Edit Check' : 'Add Check'}</Legend>}
        <VerticalGroup>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <hr className={styles.breakLine} />
              <Field label="Job name" invalid={Boolean(errors.job)} error={errors.job?.message}>
                <Input
                  {...register('job', {
                    required: true,
                    minLength: 1,
                  })}
                  type="text"
                  id="check-editor-job-input"
                  placeholder="Unnamed request"
                  className={styles.jobNameInput}
                />
              </Field>
              <ProbeOptions
                isEditor={isEditor}
                timeout={check?.timeout ?? multiHttpFallbackCheck.timeout}
                frequency={check?.frequency ?? multiHttpFallbackCheck.frequency}
                probes={check?.probes ?? multiHttpFallbackCheck.probes}
                checkType={CheckType.MULTI_HTTP}
              />

              <hr />
              <h3>Requests</h3>
              <Field label="At least one target HTTP is required; limit 10 requests per check. Let's get started.">
                <></>
              </Field>
              <div className={styles.request}>
                {fields.map((field, index) => {
                  const urlForIndex = watch(`settings.multihttp.entries.${index}.request.url`);

                  return (
                    <MultiHttpCollapse label={urlForIndex} key={field.id} className={styles.collapseTarget}>
                      <VerticalGroup height={'100%'}>
                        <HorizontalGroup spacing="lg" align="center">
                          <Field
                            label="Request target"
                            description="Full URL to send request to"
                            invalid={Boolean(errors?.settings?.multihttp?.entries?.[index]?.request?.url?.message)}
                            error={errors?.settings?.multihttp?.entries?.[index]?.request?.url?.message}
                          >
                            <Input
                              id={`request-target-url-${index}`}
                              {...register(`settings.multihttp.entries.${index}.request.url` as const, {
                                required: true,
                                validate: (url) => validateTarget(CheckType.MULTI_HTTP, url),
                              })}
                            />
                          </Field>
                          <Field
                            label="Request method"
                            description="The HTTP method used"
                            invalid={Boolean(errors?.settings?.multihttp?.entries?.[index]?.request?.method)}
                            error={errors?.settings?.multihttp?.entries?.[index]?.request?.method}
                          >
                            <Controller
                              name={`settings.multihttp.entries.${index}.request.method`}
                              render={({ field }) => (
                                <Select {...field} options={METHOD_OPTIONS} data-testid="request-method" />
                              )}
                              rules={{ required: true }}
                            />
                          </Field>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setUrls(urls.filter((url, i) => i !== index));
                              remove(index);
                            }}
                            className={styles.removeRequestButton}
                          >
                            Remove
                          </Button>
                        </HorizontalGroup>

                        <AvailableVariables index={index} />

                        <TabSection index={index} />
                      </VerticalGroup>
                    </MultiHttpCollapse>
                  );
                })}
                <Button
                  type="button"
                  fill="text"
                  size="md"
                  icon="plus"
                  onClick={() => {
                    append({});
                  }}
                  className={styles.addRequestButton}
                >
                  Add request
                </Button>

                {errorMessages && errorMessages?.length > 0 && getErrorMessages()}
                <HorizontalGroup height="40px">
                  <Button type="submit" disabled={formMethods.formState.isSubmitting}>
                    Save
                  </Button>
                  {check?.id && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={!isEditor}
                      type="button"
                    >
                      Delete Check
                    </Button>
                  )}
                  <LinkButton onClick={() => onReturn && onReturn(true)} fill="text">
                    Back
                  </LinkButton>
                </HorizontalGroup>
              </div>
            </form>
          </FormProvider>
        </VerticalGroup>
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete check"
          body="Are you sure you want to delete this check?"
          confirmText="Delete check"
          onConfirm={onRemoveCheck}
          onDismiss={() => setShowDeleteModal(false)}
        />
      </PluginPage>
    </>
  );
};