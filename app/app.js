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
    },db: {
        type: 'dynamodb',
        tableName: 'quizGame',
    },
    saveUserOnResponseEnabled: true,
    userDataCol: 'userData',
    userMetaData: {
        lastUsedAt: true,
        sessionsCount: true,
        createdAt: true,
        requestHistorySize: 0,
        devices: false,
    }
};

const app = new App(config);

// Using the setter
app.setDynamoDb('quizGame');

//Questions for the quiz
var questions = require('./jsonfiles/question.json');

//MasterQuiz rankings
var rankings = require('./jsonfiles/ranks.json');

//MasterQuiz themes
var themes = require('./jsonfiles/themes.json');

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
       this.toIntent("WelcomeIntent");
    },

    'WelcomeIntent': function(){
        this.user().data.points = 0;
        this.user().data.rank = "Novice";

        this.ask('Welcome to Master Quiz! Ready to test your knowledge and have a good time? If so ask me for a quiz or your rank and let’s begin.');
    },

    'QuizIntent': function() {
       this.ask("Let’s begin your journey. I have quizzes about Science and Nature, Sports and Geography. Want try one of this or want more themes?");
    },

    'ThemesIntent': function(){
        var theme = this.getInput("theme").value;
        this.addSessionAttribute("theme",theme);
        this.ask("Which level of difficulty do you want easy, medium or hard?");

    },

    'MoreThemesIntent': function(){
        this.ask("The rest of the themes are general knowledge, music and film. Which one do you want?");
    },

    'DifficultyIntent': function(){
        var level = this.getInput("difficulty").value;
        this.addSessionAttribute("level",level);
        this.ask("Do you want true or false or multiple choice questions?");
    },

    'TypeofQuestionIntent': function(){
        var type = this.getInput("typeofquestion").value;
        this.addSessionAttribute("type",type);

        this.followUpState('StartState').ask("So you want a "+this.getSessionAttribute("level")+" "+type+" quiz about "+this.getSessionAttribute("theme")+", are you sure?","Do you want to tackle this quiz?");
    },

    'StartState': {
        'QuestionIntent': function(){
            var quiz_type = '';
            
            if(this.getSessionAttribute("theme") === "random"){
                var index = Math.floor((Math.random()*6));
                quiz_type += themes[index];
            }else{
                quiz_type += this.getSessionAttribute("theme");
            }

            if(this.getSessionAttribute("type") === "true or false"){
                quiz_type += "_boolean_"
            }else{
                quiz_type += "_multiple_";
            }
            
            quiz_type += this.getSessionAttribute("level");
            
            var qts = questions[quiz_type];
            console.log(qts);
            this.addSessionAttribute(qts);
            this.ask("Hello");
        },

        'YesIntent': function(){
            this.toStateIntent('StartState',"QuestionIntent");
        },

        'NoIntent': function(){
            this.ask("Okay, let's design another quiz! I have quizzes about Science and Nature, Sports and Geography. Want try one of them or want to know more? ")
        }
           
    },

    'QuizState':{
        'AnswerIntent': function(){

        },
    },

    'ScoreIntent': function(){
        var data = this.user().data;

        //Tell the user rank
        if(data.points >= 0 && data.points < 50){
            this.ask("You are a "+ rankings[0]+" but with our joined forces and some quizzes you will be a master in no time.");
        }else if(data.points >= 50 && data.points < 100){
            this.ask("You are an "+rankings[1]+" you are not quite there yet but keep quizzing and the master rank will be yours.");
        }else if(data.points >= 100 && data.points < 150){
            this.ask("You are already a "+rankings[2]+" at performing quizzes with success.");
        }else if(data.points >= 150 && data.points < 300){
            this.ask("Congratulations you are a "+rankings[3]+". Keep going, you are almost a Master");
        }else if(data.points >= 300){
            this.ask("Make your way for the "+rankings[4] +" but you cannot rest now you still have many quizzes to try and slay.");
        }
        
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

    },
    'Unhandled': function(){
        this.toIntent('LAUNCH');
    },

});

module.exports.app = app;