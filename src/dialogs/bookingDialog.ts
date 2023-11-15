// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { InputHints, MessageFactory, UserState } from 'botbuilder';
import {
    ComponentDialog,
    ConfirmPrompt,
    DialogTurnResult,
    NumberPrompt,
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

        this.addDialog(new NumberPrompt(NUMBER_PROMPT))
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
        const bookingDetails = stepContext.options as BookingDetails;
    
        const promptOptions = { prompt: 'Please enter your age.' };
        return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
    }

    // Name
    async nameStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult>{
        const bookingDetails = stepContext.options as BookingDetails;
        bookingDetails.age = stepContext.result;

        // if(stepContext.result < 18){
        //     await stepContext.context.sendActivity('You must be an adult to make a booking');
        //     return await stepContext.next();
        // } else {
        //     return await stepContext.begin
        // }

        const promptOptions = { prompt: 'Please enter your name.' };
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
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
    
        const messageText = `Please confirm, I have you this info ${bookingDetails.age}. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });    
    }


    // summary
    async summaryStep(stepContext) {
        console.log('stepcontext', stepContext.options)
        if(stepContext.result){
            const bookingDetails = stepContext.options;       
            const messageText = `Booking completed with ${bookingDetails.age} ${bookingDetails.name} ${bookingDetails.address}`;
            return await stepContext.prompt(CONFIRM_PROMPT, { prompt: messageText });    

        }
    }

}
