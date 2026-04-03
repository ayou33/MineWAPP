import { logFor } from '@/common/log'
import { brand } from '@/config'
import { fallback, t, te } from '@/features/i18n/index'
import { mergeProps, ParentProps, splitProps, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'

const log = logFor('I18n')

type KnownProps = {
  path: string;
  eol?: string | RegExp; // end of line
  is?: ValidComponent;
  args?: Data;
  multiline?: boolean;
}

export type I18nProps = InheritProps<ParentProps<KnownProps & {
  [p in string]: unknown;
}>>

const defaultProps: Required<KnownProps> = {
  path: '',
  eol: /[;；]/,
  is: 'span',
  args: {
    brand: brand,
  },
  multiline: false,
}

export default function I18n (props: I18nProps) {
  const [local, properties] = splitProps(
    mergeProps(defaultProps, props),
    ['path', 'eol', 'is', 'children', 'args', 'multiline'],
  )
  const useHTMLContent = local.args?.colorful || local.multiline
  
  log('i18n render', local.args)
  
  function render () {
    let textContent: string = te(local.path) ? t(local.path, local.args) : (fallback(local.path, local.args!) ?? local.children ?? local.path)
    
    if (local.multiline) {
      textContent = textContent.split(local.eol).map(line => `${line}<br />`).join('')
    }
    
    return {
      children: textContent,
      innerHTML: useHTMLContent ? textContent : undefined,
    }
  }
  
  return <Dynamic component={local.is} {...properties} {...render()} />
}

I18n.p = function (props: I18nProps) {
  return <I18n {...props} is="p" />
}

I18n.div = function (props: I18nProps) {
  return <I18n {...props} is="div" />
}

I18n.button = function (props: I18nProps) {
  return <I18n {...props} is="button" />
}

I18n.span = function (props: I18nProps) {
  return <I18n {...props} is="span" />
}
