import { faro, isError, isObject } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

export enum FaroEvent {
  INIT = 'initialize',
  UPDATE_CHECK = 'update_check',
  BULK_UPDATE_CHECK = 'bulk_update_check',
  BULK_DELETE_CHECK = 'bulk_delete_check',
  DELETE_CHECK = 'delete_check',
  TEST_CHECK = 'test_check',
  CREATE_CHECK = 'create_check',
  CREATE_PROBE = 'create_probe',
  UPDATE_PROBE = 'update_probe',
  DELETE_PROBE = 'delete_probe',
  RESET_PROBE_TOKEN = 'reset_probe_token',
  DISABLE_PLUGIN = 'disable_plugin',
  CREATE_ACCESS_TOKEN = 'create_access_token',
  SAVE_THRESHOLDS = 'save_thresholds',
  SHOW_TERRAFORM_CONFIG = 'show_terraform_config',
  REFETCH_TENANT_LIMITS = 'refetch_tenant_limits',
  INITIALIZE_ACCESS_TOKEN = 'initialize_access_token',
  UPDATE_CHECK_ALERTS = 'update_check_alerts',
  NO_PROBE_MAPPING_FOUND = 'no_probe_mapping_found',
}

export enum FaroEnv {
  DEV = 'development',
  STAGING = 'staging',
  PROD = 'production',
}

export type FaroEventMeta = {
  type: FaroEvent;
  info?: Record<string, string>;
};

export function isFaroEventMeta(event?: unknown): event is FaroEventMeta {
  if (!event) {
    return false;
  }

  return typeof event === 'object' && 'type' in event;
}

export function pushFaroCount(type: string, count: number) {
  try {
    faro.api?.pushMeasurement({ type, values: { count } });
  } catch (e) {}
}

export function reportEvent(type: FaroEvent, info: Record<string, string> = {}) {
  const attributes = {
    ...info,
    slug: config.bootData.user.orgName,
  };

  try {
    faro.api?.pushEvent(type, attributes);
  } catch (e) {
    console.error(`Failed to report event: ${type}`, e);
  }
}

function sanitizeError(error: Error | Object | string) {
  if (isError(error)) {
    return error;
  }
  if (isObject(error)) {
    return new Error(JSON.stringify(error));
  }
  return new Error(error);
}

export function reportError(error: Error | Object | string, type?: FaroEvent) {
  const valToSend = sanitizeError(error);
  try {
    faro.api.pushError(valToSend, { type });
  } catch (e) {}
}

function getFaroEnv(): FaroEnv {
  const appUrl = new URL(config.appUrl).hostname;
  switch (true) {
    case appUrl.endsWith('grafana-ops.net'):
      return FaroEnv.STAGING;
    case appUrl.endsWith('grafana.net'):
      return FaroEnv.PROD;
    case appUrl.endsWith('grafana-dev.net'):
    case appUrl.endsWith('localhost'):
    default:
      return FaroEnv.DEV;
  }
}

export function getFaroConfig() {
  const env = getFaroEnv();
  switch (env) {
    case FaroEnv.DEV:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/769f675a8e1e8b05f05b478b7002259b',
        name: 'synthetic-monitoring-app-dev',
        env: FaroEnv.DEV,
      };
    case FaroEnv.STAGING:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/73212b0adc2a3d002ee3befa3b48c4d9',
        name: 'synthetic-monitoring-app-staging',
        env: FaroEnv.STAGING,
      };
    case FaroEnv.PROD:
    default:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/837791054a26c6aba5d32ece9030be32',
        name: 'synthetic-monitoring-app-prod',
        env: FaroEnv.PROD,
      };
  }
}
