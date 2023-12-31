// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { BookingDetails } from './bookingDetails';

import { CardFactory, InputHints, MessageFactory, StatePropertyAccessor, TurnContext } from 'botbuilder';

import {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { BookingDialog } from './bookingDialog';
import { WeatherDialog } from './weatherDialog';


const moment = require('moment');
const CHOICE_PROMPT = 'CHOICE_PROMPT';

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

export class MainDialog extends ComponentDialog {

    constructor(bookingDialog: BookingDialog) {
        super('MainDialog');

        if (!bookingDialog) throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        // this.addDialog(new TextPrompt('TextPrompt'));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(bookingDialog);
        this.addDialog(new WeatherDialog())

        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.menuStep.bind(this),
            this.actStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     */
    public async run(turnContext: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    private async menuStep(stepContext: WaterfallStepContext) {
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        stepContext.context.sendActivity('Hi, I am flight reservation bot 🤖✈️')
        return await stepContext.prompt(CHOICE_PROMPT, {
            choices: ChoiceFactory.toChoices(['Book a flight', 'Weather info', 'Help']),
            prompt: 'How can I help you today? Select an item'
        });
    }

    /**
     * Second step in the waterall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    private async actStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const bookingDetails = new BookingDetails();
        switch (stepContext.result.value) {
            case 'Book a flight':
                return await stepContext.beginDialog('bookingDialog', bookingDetails);
                break;
            case 'Weather info':
                return await stepContext.beginDialog('weatherDialog');

                // await stepContext.context.sendActivity('Weather info');
                break;
            case 'Help':
                await stepContext.context.sendActivity('Help');
        }
        return await stepContext.next();
    }


    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    private async finalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            console.log('main', stepContext.result)
            // Now we have all the booking details.

            // This is where calls to the booking AOU service or database would go.

            // If the call to the booking service was successful tell the user.
            // const timeProperty = new TimexProperty(result.travelDate);
            // const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
            const bookingDetails = stepContext.result as BookingDetails;
            const msg = `Booking completed-: ${bookingDetails}`
            const card = CardFactory.heroCard(
                `Flight from ${bookingDetails.origin} to ${bookingDetails.destination} on ${bookingDetails.travelDate}`,
                `Name: ${bookingDetails.name}, ${bookingDetails.age} `
            );
            const message = MessageFactory.attachment(card);
            await stepContext.context.sendActivity(message);
            // const msg = `I have you booked to ${result.destination} from ${result.origin} on ${travelDateMsg}.`;
            // await stepContext.context.sendActivity(msg);
        }

        // Restart the main dialog waterfall with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}
