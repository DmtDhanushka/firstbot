// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActionTypes, ActivityHandler, MessageFactory, TurnContext } from 'botbuilder';

export class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo : ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMessage(context: TurnContext) {
        const membersAdded = context.activity.membersAdded;
        const welcomeText = 'Hey there!';
        for (const member of membersAdded) {
            if (member.id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                await this.sendSuggestedActions(context)
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        const cardActions = ['Book reservation', 'know more info'];
        var reply = MessageFactory.suggestedActions(cardActions, 'How can I help you?');
        await turnContext.sendActivity(reply);
    }
}
