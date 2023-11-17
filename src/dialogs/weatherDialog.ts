
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

export class WeatherDialog extends ComponentDialog {
    constructor() {
        super('weatherDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.cityStep.bind(this),
                this.actStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }



    // Address
    async cityStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
        const promptOptions = { prompt: 'Please enter the city for info.' };
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    async actStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
        const city = stepContext.result;
        let sentence;


        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.weatherKey}`);

            const { name, weather, main, wind } = response.data;
            const description = weather[0].description;
            const temperature = main.temp;
            const feelsLike = main.feels_like;
            const windSpeed = wind.speed;

            sentence = `In ${name}, it's currently ${description}. The temperature is ${temperature} Kelvin, but it feels like ${feelsLike} Kelvin. The wind speed is ${windSpeed} m/s.`;

            console.log(sentence);
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
        await stepContext.context.sendActivity(sentence)

        return stepContext.endDialog();

    }

    // async finalStep(stepContext: WaterfallStepContext<BookingDetails>): Promise<DialogTurnResult> {
    //     const bookingDetails = stepContext.options as BookingDetails;
    //     bookingDetails.name = stepContext.result;
    //     const promptOptions = { prompt: 'Please enter the city for info.' };
    //     return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    // }
}