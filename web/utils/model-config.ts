import type { UserInputFormItem } from '@/types/app'
import type { PromptVariable } from '@/models/debug'

export const userInputsFormToPromptVariables = (useInputs: UserInputFormItem[] | null) => {
  if (!useInputs)
    return []
  const promptVariables: PromptVariable[] = []
  useInputs.forEach((item: any) => {
    const isParagraph = !!item.paragraph
    const [type, content] = (() => {
      if (isParagraph)
        return ['paragraph', item.paragraph]

      if (item['text-input'])
        return ['string', item['text-input']]

      return ['select', item.select]
    })()
    if (type === 'string' || type === 'paragraph') {
      promptVariables.push({
        key: content.variable,
        name: content.label,
        required: content.required,
        type,
        max_length: content.max_length,
        options: [],
      })
    }
    else {
      promptVariables.push({
        key: content.variable,
        name: content.label,
        required: content.required,
        type: 'select',
        options: content.options,
      })
    }
  })
  return promptVariables
}

export const promptVariablesToUserInputsForm = (promptVariables: PromptVariable[]) => {
  const userInputs: UserInputFormItem[] = []
  promptVariables.filter(({ key, name }) => {
    if (key && key.trim() && name && name.trim())
      return true

    return false
  }).forEach((item: any) => {
    if (item.type === 'string' || item.type === 'paragraph') {
      userInputs.push({
        [item.type === 'string' ? 'text-input' : 'paragraph']: {
          label: item.name,
          variable: item.key,
          required: item.required !== false, // default true
          max_length: item.max_length,
          default: '',
        },
      } as any)
    }
    else {
      userInputs.push({
        select: {
          label: item.name,
          variable: item.key,
          required: item.required !== false, // default true
          options: item.options,
          default: '',
        },
      } as any)
    }
  })
  return userInputs
}
