const appVersion = '9.9.9'
const isApp = false
const isIOSApp = false
const isAndroidApp = false
const application = {
  context: {
    appVersion,
  },
}

export enum Feature {
  A = 'a',
}

type FeatureControl = {
  groups?: number[];
  versions?: {
    android?: string;
    ios?: string;
    web?: boolean;
  };
}

export const ControlledFeatures: Partial<Record<Feature, FeatureControl>> = {
  [Feature.A]: {
    versions: {
      ios: '9.9.9',
    },
  },
}

function compareVersion (ver = '', ref = '') {
  const v1Arr = ver.split('.')
  const v2Arr = ref.split('.')
  const len = Math.max(v1Arr.length, v2Arr.length)
  for (let i = 0; i < len; i++) {
    const version = parseInt(v1Arr[i] || '0')
    const refer = parseInt(v2Arr[i] || '0')
    if (version > refer) {
      return 1
    } else if (version < refer) {
      return -1
    }
  }
  return 0
}

function gte (ref: string) {
  return compareVersion(application.context?.appVersion ?? appVersion, ref) >= 0
}

export function compatible (feature: Feature) {
  const config = ControlledFeatures[feature]
  
  if (!config?.versions) {
    return true
  }
  
  console.log('compatible', feature, config.versions, application.context?.appVersion)
  
  if (isIOSApp && config.versions.ios) {
    return gte(config.versions.ios)
  }
  
  if (isAndroidApp && config.versions.android) {
    return gte(config.versions.android)
  }
  
  return isApp ? true : config.versions.web === true
}
