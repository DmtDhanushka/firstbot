
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
import { CLUResult } from './cluResult';
const axios = require('axios');

const BOOKING_DIALOG = 'bookingDialog'
const FLIGHT_RECOGNIZER = 'flightRecognizer'

const NUMBER_PROMPT = 'NUMBER_PROMPT';
const TEXT_PROMPT = 'textPrompt';
const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

export class FlightRecognizer extends ComponentDialog {
    constructor() {
        super(FLIGHT_RECOGNIZER);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.plan.bind(this),
                this.actStep.bind(this),
                this.reviewStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    // plan
    async plan(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {

        const promptOptions = { prompt: 'Please describe your plan.' };
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);


    }

    // Act
    async actStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
        // const bookingDetails = stepContext.options as BookingDetails;
        const plan = stepContext.result;
        const cluResponse = await this.cluProcess(plan)

        // // intent
        // if (stepContext.options.intent = 'BookFlight') {
        //     if (!stepContext.options.origin) {
        //         console.log('no from city')
        //     }

        //     if (stepContext.options.destination == undefined) {
        //         console.log('no to city')
        //         return await this.toCityStep(stepContext);
        //     }

        //     if (stepContext.options.travelDate == undefined) {
        //         console.log('no date')
        //         return await this.dateStep(stepContext);
        //     }


        // }

        const messageText = `${JSON.stringify(cluResponse)} Is this correct? 🤔`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    // Confirm
    // async confirmStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
    //     // const bookingDetails = stepContext.options as BookingDetails;
    //     // const plan = stepContext.result;

    //     const bookingDetails = stepContext.options as BookingDetails;

    //     const messageText = `${JSON.stringify(bookingDetails)} Is this correct?`;
    //     const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

    //     // Offer a YES/NO prompt.
    //     return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    // }

    // async toCityStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
    //     if (stepContext.options.destination == undefined) {
    //         const promptOptions = { prompt: 'Please enter tocty.' };
    //         stepContext.options.lastQ = 'city';
    //         return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    //     } else {
    //         return await stepContext.next();
    //     }
    // }

    // async dateStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
    //     if (stepContext.options.travelDate == undefined) {

    //         const promptOptions = { prompt: 'Please enter date.' };
    //         stepContext.options.lastQ = 'date';
    //         return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    //     } else {
    //         return await stepContext.next();
    //     }
    // }

    // async answerStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {

    //     switch (stepContext.options.lastQ) {
    //         case 'city':
    //             stepContext.options.destination = stepContext.result;
    //             break;
    //         case 'date':
    //             stepContext.options.travelDate = stepContext.result;
    //         default:
    //             break;
    //     }

    //     const messageText = `Booking data: ✅`;
    //     await stepContext.context.sendActivity(messageText);
    //     return await stepContext.next();

    // }

    // summary
    async reviewStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
        // console.log('stepcontext', stepContext.options)
        if (stepContext.result) {
            const bookingDetails = stepContext.options;
            const messageText = `Booking completed ✅`;
            await stepContext.context.sendActivity(messageText);
            return await stepContext.endDialog();
        } else {
            await stepContext.context.sendActivity('Please try again 😕')
            return await stepContext.next();
        }
    }

    async cluProcess(conv: string) {
        const res = await this.getCLUresult(conv);
        const prediction = res.result.prediction;
        const cluResult = new CLUResult();
        const categorizedData: {
            fromCity?: string;
            toCity?: string;
            flightDate?: string;
            // Add more properties if needed
        } = {};

        cluResult.intent = prediction.topIntent;

        if (prediction.entities.length > 0) {
            prediction.entities.forEach(item => {
                categorizedData[item.category] = item.text;
            });
        }

        cluResult.fromCity = categorizedData.fromCity;
        cluResult.toCity = categorizedData.toCity;
        cluResult.date = categorizedData.flightDate;

        console.log(cluResult)
        return cluResult;

    }

    async getCLUresult(conversation: string) {
        try {
            const data = {
                "kind": "Conversation",
                "analysisInput": {
                    "conversationItem": {
                        "id": "1",
                        "participantId": "1",
                        "text": conversation
                    }
                },
                "parameters": {
                    "projectName": "FlightBooking",
                    "deploymentName": "Testing",
                    "stringIndexType": "TextElement_V8"
                }
            }
            const response = await axios.post('https://langres083.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2023-04-01',
                data,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': process.env.langKey
                    }
                })
            console.log('CLU API', response.status);
            return (response.data)
        } catch (error) {
            console.error(error)
        }
    }

}