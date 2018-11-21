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
const questions = require('./jsonfiles/question.json');

//MasterQuiz rankings
const rankings = require('./jsonfiles/ranks.json');

//MasterQuiz themes
const themes = require('./jsonfiles/themes.json');

//NUM_MAX_QUESTIONS
const NUM_MAX_QUESTIONS = 5;

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
       this.toIntent("WelcomeIntent");
    },

    'WelcomeIntent': function(){
        this.user().data.points = 0;
        this.user().data.rank = "Apprentice";
        this.addSessionAttribute("device",this.getType());

        this.ask('Welcome to Master Quiz! Ready to test your knowledge and have a good time? If so ask me for a quiz or your rank and let’s begin.',"Do you want to do a quiz or know your rank?");
    },

    'QuizIntent': function() {
        var dev = this.getSessionAttribute("device");

        if(dev == "GoogleAction"){
            this.ask("Let’s begin your journey. I have quizzes about Science and Nature, Sports, Film and General Knowledge. Which one do you want?"," Which theme do you want?");
        }else{
            this.ask("Let’s begin your journey. I have quizzes about Science and Nature, Sports and Geography. Want try one of this or want more themes?","One of this themes or want to see the rest?");
        }
    },

    'ThemesIntent': function(){
        var theme = this.getInput("theme").value;
        this.addSessionAttribute("theme",theme.toLowerCase());

        this.ask("Which level of difficulty do you want, easy, medium or hard?","Easy, medium or hard?");

    },

    'MoreThemesIntent': function(){
        this.ask("The rest of the themes are general knowledge, music and film. Which one do you want?","Which theme do you choose?");
    },

    'DifficultyIntent': function(){
        var level = this.getInput("difficulty").value;
        this.addSessionAttribute("level",level.toLowerCase());

        this.ask("Do you want true or false or multiple choice questions?","True of false or multiple choice questions?");
    },

    'TypeofQuestionIntent': function(){
        var type = this.getInput("typeofquestion").value;
        this.addSessionAttribute("type",type.toLowerCase());

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
            this.addSessionAttribute("questions",qts);
            
            var qts_position = 0;
            this.addSessionAttribute("index",qts_position);

            var qts_score = 0;
            this.addSessionAttribute("current_score",qts_score);
            
            var first_question = '';

            if(this.getSessionAttribute("type") === "multiple choice" || this.getSessionAttribute("type") === "choice" 
            || this.getSessionAttribute("type") === "multiple" || this.getSessionAttribute("type") === "mult"){
                first_question = qts[0].question;
                first_question += " ";
                first_question += qts[0].correct_answer;
                first_question += ", ";
                first_question += qts[0].incorrect_answers[0];
                first_question += ", ";
                first_question += qts[0].incorrect_answers[1];
                first_question += ", ";
                first_question += qts[0].incorrect_answers[2];
            }else{
                first_question = qts[0].question;
            }

            this.addSessionAttribute("current_question",first_question);
            
            this.followUpState('QuizState').ask("Get yourself ready: "+first_question,first_question);
        },

        'RepeatIntent': function(){
            this.ask(this.getSessionAttribute("current_question"),this.getSessionAttribute("current_question"));
        },

        'StopIntent': function(){
            this.ask("Do you want to pass this question or try another quiz?","Want the next question or ask for another quiz?");
        },
    
        'CancelIntent': function(){
            this.ask("Do you want to pass this question or try another quiz?","Want the next question or ask for another quiz?");
        },

        'YesIntent': function(){
            this.toStateIntent('StartState',"QuestionIntent");
        },

        'NoIntent': function(){
            this.ask("Okay, let's design another quiz! I have quizzes about Science and Nature, Sports and Geography. Want try one of them or want to know more?","One of this themes or want to see the rest?");
        }
           
    },

    'QuizState':{
        'AnswerIntent': function(){
            checkUserAnswer.call(this,false);
        },

        'DontKnowIntent': function(){
            checkUserAnswer.call(this,true);
        },

        'RepeatIntent': function(){
            this.ask(this.getSessionAttribute("current_question"),this.getSessionAttribute("current_question"));
        },
    },

    'ScoreIntent': function(){
        var data = this.user().data;

        //Tell the user rank
        if(data.points >= 0 && data.points < 50){
            this.ask("You are an "+ rankings[0]+" but with our joined forces and some quizzes you will be a master in no time.","You are an "+rankings[0]);
        }else if(data.points >= 50 && data.points < 100){
            this.ask("You are a "+rankings[1]+" you are not quite there yet but keep quizzing and the master rank will be yours.","You are a "+rankings[1]);
        }else if(data.points >= 100 && data.points < 150){
            this.ask("You are already an "+rankings[2]+" at performing quizzes with success.","You are already an "+rankings[2]);
        }else if(data.points >= 150 && data.points < 300){
            this.ask("Congratulations you are a "+rankings[3]+". Keep going, you are almost a Master","Congratulations you are a "+rankings[3]);
        }else if(data.points >= 300){
            this.ask("Make your way for the "+rankings[4] +" but you cannot rest now you still have many quizzes to try and slay.","Make your way for the "+rankings[4]);
        }
        
    },

    'StopIntent': function(){
        this.ask("Goodbye, hope you had a fun time and don't forget to return so you can continue your journey to Mastery");
    },

    'CancelIntent': function(){
        this.ask("Looking forward to your next quest for knowledge. Hope to see you soon.");
    },

    'HelpIntent': function(){
        this.ask("I am here to help you on your journey to Master of Knowledge. You can ask me for a quiz or your current rank. The ranking goes from Apprentice to Master and for each correct answer you get 5 points.","Wanna do a quiz or know your rank?");
    },

    'Unhandled': function(){
        this.toIntent('LAUNCH');
    },

});

// <-------------- Auxiliar functions ------------->

function checkUserAnswer(userDoesntKnow){
    var alexaSays = '';
    var data = this.user().data;
    var qts = this.getSessionAttribute("questions");
    var qts_position = this.getSessionAttribute("index");
    var qts_score = this.getSessionAttribute("current_score");

    if(!userDoesntKnow){
        var user_answer = this.getInput("answer").value.toLowerCase();
        
        if(user_answer == qts[qts_position].correct_answer.toLowerCase()){
            qts_score += 5;
            
            if(this.user().data.points >= 50 && this.user().data.points < 100){
                this.user().data.rank = rankings[1];
            }else if(this.user().data.points >= 100 && this.user().data.points < 150){
                this.user().data.rank = rankings[2];
            }else if(this.user().data.points >= 150 && this.user().data.points < 300){
                this.user().data.rank = rankings[3];
            }else if(this.user().data.points >= 300){
                this.user().data.rank = rankings[4];
            }

            alexaSays = "Congrats you got that one right ";
        }else{
            alexaSays ="Better luck next time, the correct answer is "+qts[qts_position].correct_answer.toLowerCase();
        }
        
    }else{
        alexaSays = "Don't give up you will get the rest right!";
    }

    if(qts_position < qts.length && qts_position+1 < NUM_MAX_QUESTIONS){
        qts_position++;
    }else{
        var points = data.points;
        points += qts_score;
        this.user().data.points = points;
        
        var howManyCorrect = qts_score/5;

        if(howManyCorrect == NUM_MAX_QUESTIONS){
            this.ask("You got "+howManyCorrect+" out of 5 questions correct! Excellent work, some more quizzes and you will be a master in no time. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }else if(howManyCorrect >= 3 && howManyCorrect < NUM_MAX_QUESTIONS){
            this.ask("You got "+howManyCorrect+" out of 5 questions correct! Keep learning and doing quizzes and you will achieve the perfect score. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }else{
            this.ask("You got "+howManyCorrect+" out of 5 questions correct! Don't feel bad just keep learning and you will soon have the perfect score. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }
        
    }

    var next_question ='';

    if(this.getSessionAttribute("type") === "multiple choice" || this.getSessionAttribute("type") === "choice" 
       || this.getSessionAttribute("type") === "multiple" || this.getSessionAttribute("type") === "mult"){
        next_question = qts[qts_position].question;
        next_question += " ";
        next_question += qts[qts_position].correct_answer;
        next_question += ", ";
        next_question += qts[qts_position].incorrect_answers[0];
        next_question += ", ";
        next_question += qts[qts_position].incorrect_answers[1];
        next_question += ", ";
        next_question += qts[qts_position].incorrect_answers[2];
    }else{
        next_question = qts[qts_position].question;
    }

    this.setSessionAttribute("current_score",qts_score);
    this.setSessionAttribute("index",qts_position);
    this.setSessionAttribute("current_session",next_question);

    this.followUpState('QuizState').ask(alexaSays+". Next question: "+next_question,next_question);
}

module.exports.app = app;