const translation = {
  pageTitle: 'Prompt Engineering',
  operation: {
    applyConfig: 'Publish',
    resetConfig: 'Reset',
    addFeature: 'Add Feature',
    automatic: 'Automatic',
    stopResponding: 'Stop responding',
    agree: 'like',
    disagree: 'dislike',
    cancelAgree: 'Cancel like',
    cancelDisagree: 'Cancel dislike',
    userAction: 'User ',
  },
  notSetAPIKey: {
    title: 'LLM provider key has not been set',
    trailFinished: 'Trail finished',
    description: 'The LLM provider key has not been set, and it needs to be set before debugging.',
    settingBtn: 'Go to settings',
  },
  trailUseGPT4Info: {
    title: 'Does not support gpt-4 now',
    description: 'Use gpt-4, please set API Key.',
  },
  feature: {
    groupChat: {
      title: 'Chat enhance',
      description: 'Add pre-conversation settings for apps can enhance user experience.',
    },
    groupExperience: {
      title: 'Experience enhance',
    },
    conversationOpener: {
      title: 'Conversation remakers',
      description: 'In a chat app, the first sentence that the AI actively speaks to the user is usually used as a welcome.',
    },
    suggestedQuestionsAfterAnswer: {
      title: 'Follow-up',
      description: 'Setting up next questions suggestion can give users a better chat.',
      resDes: '3 suggestions for user next question.',
      tryToAsk: 'Try to ask',
    },
    moreLikeThis: {
      title: 'More like this',
      description: 'Generate multiple texts at once, and then edit and continue to generate',
      generateNumTip: 'Number of each generated times',
      tip: 'Using this feature will incur additional tokens overhead',
    },
    speechToText: {
      title: 'Speech to Text',
      description: 'Once enabled, you can use voice input.',
      resDes: 'Voice input is enabled',
    },
    dataSet: {
      title: 'Context',
      noData: 'You can import datasets as context',
      words: 'Words',
      textBlocks: 'Text Blocks',
      selectTitle: 'Select reference dataset',
      selected: 'Datasets selected',
      noDataSet: 'No dataset found',
      toCreate: 'Go to create',
      notSupportSelectMulti: 'Currently only support one dataset',
    },
  },
  automatic: {
    title: 'Automated application orchestration',
    description: 'Describe your scenario, TotalGPT will orchestrate an application for you.',
    intendedAudience: 'Who is the intended audience?',
    intendedAudiencePlaceHolder: 'e.g. Student',
    solveProblem: 'What problems do they hope AI can solve for them?',
    solveProblemPlaceHolder: 'e.g. Assessing academic performance',
    generate: 'Generate',
    audiencesRequired: 'Audiences required',
    problemRequired: 'Problem required',
    resTitle: 'We have orchestrated the following application for you.',
    apply: 'Apply this orchestration',
    noData: 'Describe your use case on the left, the orchestration preview will show here.',
    loading: 'Orchestrating the application for you...',
    overwriteTitle: 'Override existing configuration?',
    overwriteMessage: 'Applying this orchestration will override existing configuration.',
  },
  resetConfig: {
    title: 'Confirm reset?',
    message:
      'Reset discards changes, restoring the last published configuration.',
  },
  errorMessage: {
    nameOfKeyRequired: 'name of the key: {{key}} required',
    valueOfVarRequired: '{{key}} value can not be empty',
    queryRequired: 'Request text is required.',
    waitForResponse:
      'Please wait for the response to the previous message to complete.',
    waitForBatchResponse:
      'Please wait for the response to the batch task to complete.',
    notSelectModel: 'Please choose a model',
  },
  chatSubTitle: 'Pre Prompt',
  completionSubTitle: 'Prefix Prompt',
  promptTip:
    'Prompts guide AI responses with instructions and constraints. Insert variables like {{input}}. This prompt won\'t be visible to users.',
  formattingChangedTitle: 'Formatting changed',
  formattingChangedText:
    'Modifying the formatting will reset the debug area, are you sure?',
  variableTitle: 'Variables',
  variableTip:
    'Users fill variables in a form, automatically replacing variables in the prompt.',
  notSetVar: 'Variables allow users to introduce prompt words or opening remarks when filling out forms. You can try entering "{{input}}" in the prompt words.',
  autoAddVar: 'Undefined variables referenced in pre-prompt, are you want to add them in user input form?',
  variableTable: {
    key: 'Variable Key',
    name: 'User Input Field Name',
    optional: 'Optional',
    type: 'Input Type',
    action: 'Actions',
    typeString: 'String',
    typeSelect: 'Select',
  },
  varKeyError: {
    canNoBeEmpty: 'Variable key can not be empty',
    tooLong: 'Variable key: {{key}} too length. Can not be longer then 16 characters',
    notValid: 'Variable key: {{key}} is invalid. Can only contain letters, numbers, and underscores',
    notStartWithNumber: 'Variable key: {{key}} can not start with a number',
    keyAlreadyExists: 'Variable key: :{{key}} already exists',
  },
  variableConig: {
    modalTitle: 'Field settings',
    description: 'Setting for variable {{varName}}',
    fieldType: 'Field type',
    string: 'Text',
    select: 'Select',
    notSet: 'Not set, try typing {{input}} in the prefix prompt',
    stringTitle: 'Form text box options',
    maxLength: 'Max length',
    options: 'Options',
    addOption: 'Add option',
  },
  openingStatement: {
    title: 'Opening remarks',
    add: 'Add',
    writeOpner: 'Write remarks',
    placeholder: 'Write your remarks message here',
    noDataPlaceHolder:
      'Starting the conversation with the user can help AI establish a closer connection with them in conversational applications.',
    varTip: 'You can use variables, try type {{variable}}',
    tooShort: 'At least 20 words of initial prompt are required to generate an opening remarks for the conversation.',
    notIncludeKey: 'The initial prompt does not include the variable: {{key}}. Please add it to the initial prompt.',
  },
  modelConfig: {
    model: 'Model',
    setTone: 'Set tone of responses',
    title: 'Model and Parameters',
  },
  inputs: {
    title: 'Debugging and Previewing',
    noPrompt: 'Try write some prompt in pre-prompt input',
    userInputField: 'User Input Field',
    noVar: 'Fill in the value of the variable, which will be automatically replaced in the prompt word every time a new session is started.',
    chatVarTip:
      'Fill in the value of the variable, which will be automatically replaced in the prompt word every time a new session is started',
    completionVarTip:
      'Fill in the value of the variable, which will be automatically replaced in the prompt words every time a question is submitted.',
    previewTitle: 'Prompt preview',
    queryTitle: 'Query content',
    queryPlaceholder: 'Please enter the request text.',
    run: 'RUN',
  },
  result: 'Output Text',
}

export default translation
