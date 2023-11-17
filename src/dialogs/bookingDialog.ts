// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { InputHints, MessageFactory, UserState } from 'botbuilder';
import {
    ComponentDialog,
    ConfirmPrompt,
    DialogTurnResult,
    NumberPrompt,
    PromptValidatorContext,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { BookingDetails } from './bookingDetails';

const BOOKING_DIALOG = 'bookingDialog'

const NUMBER_PROMPT = 'NUMBER_PROMPT';
const TEXT_PROMPT = 'textPrompt';
const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

export class BookingDialog extends ComponentDialog {
    
    constructor() {
        super(BOOKING_DIALOG);
        // this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.agePromptValidator))
            .addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.ageStep.bind(this),
                this.nameStep.bind(this),
                this.addressStep.bind(this),
                this.confirmStep.bind(this),
                this.summaryStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    // Age
    async ageStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult>{
    
        const promptOptions = { 
            prompt: 'Please enter your age.',  
            retryPrompt: '⚠️ Age should be greater than 18 and less than 100.' };
        return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
    }

    // Name
    async nameStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult>{
        const bookingDetails = stepContext.options as BookingDetails;
        bookingDetails.age = stepContext.result;

        if(stepContext.result < 18){
            await stepContext.context.sendActivity('You must be an adult to make a booking, please try again');
            return await stepContext.endDialog(false);
        } else {
            const promptOptions = { prompt: 'Please enter your name.' };
            return await stepContext.prompt(TEXT_PROMPT, promptOptions);
        }
    }

    // Address
    async addressStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult>{
        const bookingDetails = stepContext.options as BookingDetails;
        bookingDetails.name = stepContext.result;
        const promptOptions = { prompt: 'Please enter your address.' };
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    // Confirm
    async confirmStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult>{
        const bookingDetails = stepContext.options as BookingDetails;
        bookingDetails.address = stepContext.result;
    
        const messageText = `Name:${bookingDetails.name}, Age:${bookingDetails.age}\n and Address:${bookingDetails.address}. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });    
    }


    // summary
    async summaryStep(stepContext) {
        // console.log('stepcontext', stepContext.options)
        if(stepContext.result){
            const bookingDetails = stepContext.options;       
            const messageText = `Booking completed ✅`;
            await stepContext.context.sendActivity(messageText);
            return await stepContext.endDialog();
        } else{
            await stepContext.context.sendActivity('Please try again 😕')
            return await stepContext.next();
        }
    }

    private async agePromptValidator(promptContext: PromptValidatorContext<number>) {
        // This condition is our validation rule. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value > 18 && promptContext.recognized.value < 150;
    }

}
