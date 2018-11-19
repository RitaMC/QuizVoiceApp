'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
    intentMap: {
        'AMAZON.YesIntent' : 'YesIntent',
        'AMAZON.NoIntent' : 'NoIntent',
        'AMAZON.RepeatIntent' : 'RepeatIntent',
        'AMAZON.StopIntent' : 'StopIntent',
        'AMAZON.CancelIntent' : 'CancelIntent',
        'AMAZON.HelpIntent' : 'HelpIntent',
    },
    db: {
        type: 'dyanodb',
        tableName: 'quizGame'
    },
    saveUserOnResponseEnabled: true,
    userDataCol: 'userData',
    userMetaData: {
        lastUsedAt: true,
        sessionsCount: true,
        createdAt: true,
        requestHistorySize: 0,
        devices: false,
    },
};

const app = new App(config);

// Using the setter
app.setDynamoDb('quizGame');

//Questions for the quiz
var questions = require('./jsonfiles/question.json');

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
       this.toIntent("WelcomeIntent");
    },

    'WelcomeIntent': function(){
        var user = this.user();
        user().data.points = 0;
        user().data.rank = "Apprentice";

        this.tell('Welcome to Master Quiz! Ready to test your knowledge and have a good time? If so ask me for a quiz or your rank and let’s begin.');
    },

    'QuizIntent': function() {
       
    },

    'ThemesIntent': function(){

    },

    'QuestionIntent': function(){

    },

    'AnswerIntent': function(){

    },
    
    'ScoreIntent': function(){
        let data = this.user().data();

        //Tell the user rank and points
        this.tell("");
    },

    'YesIntent': function(){

    },

    'NoIntent': function(){

    },

    'RepeatIntent': function(){

    },

    'StopIntent': function(){

    },

    'CancelIntent': function(){

    },

    'HelpIntent': function(){

    }

});

module.exports.app = app;
