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
        'AMAZON.FallbackIntent' : 'FallbackIntent',
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

//Questions for the quiz in A.Alexa
const questionsAA = require('./jsonfiles/question.json');

//Questions for the quiz in G.Assistant
const questionsGA = require('./jsonfiles/question_GA.json');

//MasterQuiz rankings
const rankings = require('./jsonfiles/ranks.json');

//MasterQuiz themes for A.Alexa
const themes = require('./jsonfiles/themes.json');

//MasterQuiz themes for G.Assistant
const themesGA = require('./jsonfiles/themesGA.json');

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
        if(this.user().metaData.createdAt == false){
            this.user().data.points = 0;
            this.user().data.rank = "Apprentice";
        }

        this.addSessionAttribute("current_sentence","Welcome to Master Quiz! Ready to test your knowledge and have a good time? If so ask me for a quiz or your rank and let’s begin.");
        this.addSessionAttribute("device",this.getType());
        this.addSessionAttribute("context","default");
        this.addSessionAttribute("error",0);

        this.ask('Welcome to Master Quiz! Ready to test your knowledge and have a good time? If so ask me for a quiz or your rank and let’s begin.',"Do you want to do a quiz or know your rank?");
    },

    'QuizIntent': function() {
        var dev = this.getSessionAttribute("device");
        this.setSessionAttribute("context","quiz_th");
        this.setSessionAttribute("error",0);
        
        if(dev == "GoogleAction"){
            this.setSessionAttribute("current_sentence","Let’s begin your journey. I have quizzes about Science and Nature, Music, Film and General Knowledge. Which one do you want?");
            this.ask("Let’s begin your journey. I have quizzes about Science and Nature, Music, Film and General Knowledge. Which one do you want?","Which theme do you want?");
        }else{
            this.setSessionAttribute("current_sentence","Let’s begin your journey. I have quizzes about Science and Nature, Sports and Geography. Want try one of this or want more themes?");
            this.ask("Let’s begin your journey. I have quizzes about Science and Nature, Sports and Geography. Want try one of this or want more themes?","One of this themes or want to see the rest?");
        }
    },

    'ThemesIntent': function(){
        var theme = this.getInput("theme").value.toLowerCase();

        if(theme == "general" || theme == "knowledge"){
            theme = "general knowledge";
        }else if(theme == "science" || theme == "nature"){
            theme = "science and nature";
        }else if(theme == "songs"){
            theme = "music";
        }else if(theme == "movies"){
            theme = "film";
        }else if(theme == "suprise me" || theme == "you choose" || theme == "don't care" || theme == "whatever"){
            var dev = this.getSessionAttribute("device");
            console.log("HERE")
            if(dev == "GoogleAction"){
                theme = themesGA[Math.floor(Math.random()*themes.length)];
            }else{
                theme = themes[Math.floor(Math.random()*themes.length)];
            }
        }
        console.log(theme);
        this.addSessionAttribute("theme",theme);
        this.setSessionAttribute("context","quiz_diff");
        this.setSessionAttribute("error",0);
        this.setSessionAttribute("current_sentence","Which level of difficulty do you want, easy, medium or hard?");

        this.ask("Which level of difficulty do you want, easy, medium or hard?","Easy, medium or hard?");
    },

    'MoreThemesIntent': function(){
        this.setSessionAttribute("error",0);
        this.setSessionAttribute("context","quiz_mth");
        this.setSessionAttribute("current_sentence","The rest of the themes are general knowledge, music and film. Which one do you want?");

        this.ask("The rest of the themes are general knowledge, music and film. Which one do you want?","Which theme do you choose?");
    },

    'DifficultyIntent': function(){
        var device = this.getSessionAttribute("device");
        var level = this.getInput("difficulty").value.toLowerCase();

        if(level == "not to hard" || level == "intermidiate"){
            level = "medium";
        }else if(level == "begginer" || level == "simple"){
            level = "easy";
        }else if(level == "super hard" || level == "advanced"){
            level = "hard";
        }

        this.setSessionAttribute("context","quiz_type");
        this.addSessionAttribute("level",level);
        this.setSessionAttribute("error",0);

        if(device == "GoogleAction"){
            //In this assistant we only have true or false questions
            this.addSessionAttribute("type","true or false");
            this.toIntent("TypeofQuestionIntent");
        }else{
            this.setSessionAttribute("current_sentence","Do you want true or false or multiple choice questions?");
            this.ask("Do you want true or false or multiple choice questions?","True of false or multiple choice questions?");
        }
       
    },

    'TypeofQuestionIntent': function(){
        var device = this.getSessionAttribute("device");
        var speechOutput = '';

        this.setSessionAttribute("error",0);
        this.setSessionAttribute("context","quiz_conf");

        if(device == "GoogleAction"){
            speechOutput = "So you want a "+this.getSessionAttribute("level")+" true or false "+"quiz about "+this.getSessionAttribute("theme")+", are you sure?";
        }else{
            var type = this.getInput("typeofquestion").value.toLowerCase();

            if(type == "choice" || type == "multiple"){
                type = "multiple choice";
            }
            this.addSessionAttribute("type",type);
        
            speechOutput = "So you want a "+this.getSessionAttribute("level")+" "+type+" quiz about "+this.getSessionAttribute("theme")+", are you sure?";
        }
        this.setSessionAttribute("current_sentence",speechOutput);
        this.followUpState('StartState').ask(speechOutput,"Do you want to tackle this quiz?");
    },

    'StartState': {
        'QuestionIntent': function(){
            var quiz_type = '';
            var device = this.getSessionAttribute("device");
            this.setSessionAttribute("error",0);
            this.setSessionAttribute("context","quiz_qts");

            quiz_type += this.getSessionAttribute("theme");

            if(this.getSessionAttribute("type") === "true or false"){
                quiz_type += "_boolean_"
            }else{
                quiz_type += "_multiple_";
            }
     
            quiz_type += this.getSessionAttribute("level");
            
            var qts = '';

            if(device == "GoogleAction"){
                qts = questionsGA[quiz_type];
            }else{
                qts = questionsAA[quiz_type];
            }
            
            this.addSessionAttribute("questions",qts);
            
            var qts_given = 1;
            this.addSessionAttribute("numQtsGiven",qts_given);

            var qts_position = [];
            var ind = Math.floor(Math.random()*qts.length);
            qts_position.push(ind);
            this.addSessionAttribute("index",qts_position);

            var qts_score = 0;
            this.addSessionAttribute("current_score",qts_score);
            
            var first_question = '';

            if(this.getSessionAttribute("type") === "multiple choice" || this.getSessionAttribute("type") === "choice" 
            || this.getSessionAttribute("type") === "multiple" || this.getSessionAttribute("type") === "mult"){
                first_question = qts[ind].question;
                first_question += " ";
                first_question += qts[ind].incorrect_answers[0];
                first_question += ", ";
                first_question += qts[ind].correct_answer;
                first_question += ", ";
                first_question += qts[ind].incorrect_answers[1];
                first_question += ", ";
                first_question += qts[ind].incorrect_answers[2];
            }else{
                first_question = qts[ind].question;
            }

            this.setSessionAttribute("current_sentence",first_question);
            
            this.followUpState('QuizState').ask("Get yourself ready: "+first_question,first_question);
        },

        'StopIntent': function(){
            this.setSessionAttribute("error",0);
            this.setSessionAttribute("current_sentence","Do you want to pass this question or try another quiz?");

            this.ask("Do you want to pass this question or try another quiz?","Want the next question or ask for another quiz?");
        },
    
        'CancelIntent': function(){
            this.setSessionAttribute("error",0);
            this.setSessionAttribute("current_sentence","Do you want to pass this question or try another quiz?");

            this.ask("Do you want to pass this question or try another quiz?","Want the next question or ask for another quiz?");
        },

        'YesIntent': function(){
            this.setSessionAttribute("error",0);

            this.toStateIntent('StartState',"QuestionIntent");
        },

        'NoIntent': function(){
            this.setSessionAttribute("error",0);

            this.ask("Okay, let's design another quiz! I have quizzes about Science and Nature, Sports and Geography. Want try one of them or want to know more?","One of this themes or want to see the rest?");
        }
           
    },

    'QuizState':{
        'AnswerIntent': function(){
            this.setSessionAttribute("error",0);

            checkUserAnswer.call(this,false);
        },

        'DontKnowIntent': function(){
            checkUserAnswer.call(this,true);
        }
    },

    'ScoreIntent': function(){
        var data = this.user().data;
        this.setSessionAttribute("error",0);
        
        //Tell the user rank
        if(data.points >= 0 && data.points < 50){
            this.setSessionAttribute("current_sentence","You are an "+rankings[0]);

            this.ask("You are an "+ rankings[0]+" but with our joined forces and some quizzes you will be a master in no time.","You are an "+rankings[0]);
        }else if(data.points >= 50 && data.points < 100){
            this.setSessionAttribute("current_sentence","You are a "+rankings[1]);

            this.ask("You are a "+rankings[1]+" you are not quite there yet but keep quizzing and the master rank will be yours.","You are a "+rankings[1]);
        }else if(data.points >= 100 && data.points < 150){
            this.setSessionAttribute("current_sentence","You are already an "+rankings[2]);

            this.ask("You are already an "+rankings[2]+" at performing quizzes with success.","You are already an "+rankings[2]);
        }else if(data.points >= 150 && data.points < 300){
            this.setSessionAttribute("current_sentence","Congratulations you are a "+rankings[3]);

            this.ask("Congratulations you are a "+rankings[3]+". Keep going, you are almost a Grand Master","Congratulations you are a "+rankings[3]);
        }else if(data.points >= 300){
            this.setSessionAttribute("current_sentence","Make your way for the "+rankings[4]);

            this.ask("Make your way for the "+rankings[4] +" but you cannot rest now you still have many quizzes to try and slay.","Make your way for the "+rankings[4]);
        }
        
    },

    'StopIntent': function(){
        this.tell("Goodbye, hope you had a fun time and don't forget to return so you can continue your journey to Mastery");
    },

    'CancelIntent': function(){
        this.tell("Looking forward to your next quest for knowledge. Hope to see you soon.");
    },

    'HelpIntent': function(){
        this.setSessionAttribute("error",0);
        this.setSessionAttribute("current_sentence","I am here to help you on your journey to Master of Knowledge. You can ask me for a quiz or your current rank. The ranking goes from Apprentice to Master and for each correct answer you get 5 points.");

        this.ask("I am here to help you on your journey to Master of Knowledge. You can ask me for a quiz or your current rank. The ranking goes from Apprentice to Master and for each correct answer you get 5 points.","Wanna do a quiz or know your rank?");
    },

    'RepeatIntent': function(){
        this.setSessionAttribute("error",0);
        this.ask(this.getSessionAttribute("current_sentence"),this.getSessionAttribute("current_sentence"));
    },

    //UNDER CONSTRUCTION
    'FallbackIntent': function(){
        var ctx = this.getSessionAttribute("context");
        var num_error = this.getSessionAttribute("error");
        var goodbye_msg = "Sorry but that is beyond my expertise. Feel free to come back when you want to do a trivia quiz";

        num_error++;
        this.setSessionAttribute("error",num_error);

        console.log(num_error);
        if(ctx === "default"){
            switch(num_error){
                case 1: 
                    this.ask("Do you want to do a quiz or know your rank?");
                    break;
                case 2: 
                    this.ask("My quiz themes range from general knowledge to movies. If this is your first time in the game you start of as an apprentice but if you keep doing quizzes you will achieve the rank of Grand Master. Wanna do a quiz or know your rank?");
                    break;
                case 3: 
                    this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_th"){
            if(num_error == 1){ 
                this.ask("Which theme do you want?");
            }else if(num_error == 2){
                var dev = this.getSessionAttribute("device");

                if(dev == "GoogleAction"){
                    this.ask("My quiz themes are Science and Nature, Music, Film and General Knowledge. Which theme do you choose?");
                }else{
                    this.ask("My quiz themes range from general knowledge to science and nature. Want to know more themes or have you already choosen one?");
                }
            }else if(num_error >= 3){
                this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_mth"){
            switch(num_error){
                case 1:
                    this.ask("The other themes are general knowledge, music and film. Which one do you choose?");
                    break;
                case 2:
                    this.ask("Along with the rest of the themes I have quizzes about general knowledge, music and film. Which theme do you want to pick?");
                    break;
                case 3:
                    this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_diff"){
            switch(num_error){
                case 1:
                    this.ask("The difficulties are easy medium or hard.");
                    break;
                case 2:
                    this.ask("Currently, my quizzes can only have a level of difficulty of easy, medium or hard.");
                    break;
                case 3:
                    this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_type"){
            switch(num_error){
                case 1:
                    this.ask("Want to do true or false or multiple choice questions?");
                    break;
                case 2:
                    this.ask("The quizzes that I currently have only allow true or false or multiple choice questions. Which one do you prefer?");
                    break;
                case 3:
                    this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_conf"){
            switch(num_error){
                case 1:
                    this.ask("Do you want to take your quiz about "+this.getSessionAttribute("theme"));
                    break;
                case 2:
                    this.ask("Currently you have a quiz to begin. Do you still want to do it?");
                    break;
                case 3:
                    this.tell(goodbye_msg);
            }
        }else if(ctx == "quiz_qts"){
            //Normally if the user is in the middle of a quiz and says something that reseambles an answer Alexa will accept it as such
            // if we says something like "give me the weather report" the skill will redirect it to this error_handler
            switch(num_error){
                case 1:
                    this.ask("Your current question is "+this.getSessionAttribute("current_sentence"));
                    break;
                case 2:
                    this.ask("Want to answer our question or pass to the next one? In case you didn't hear the current questions is "+this.getSessionAttribute("current_sentence"));
                    break;
                case 3:
                    this.tell(goodbye_msg);
            }
        }else{
            this.tell(goodbye_msg);
        }
    },

    'Unhandled': function(){
        this.toIntent('FallbackIntent');
    }
});

// <-------------- Auxiliar functions ------------->

function checkUserAnswer(userDoesntKnow){
    var alexaSays = '';
    var data = this.user().data;
    var qts = this.getSessionAttribute("questions");
    var qts_given = this.getSessionAttribute("numQtsGiven");
    var qts_position = this.getSessionAttribute("index");
    var qts_score = this.getSessionAttribute("current_score");

    if(!userDoesntKnow){
        var user_answer =  this.getInput("answer").value.toLowerCase();
        
        if(user_answer == qts[qts_position[qts_position.length-1]].correct_answer.toLowerCase()){
            qts_score += 5;

            alexaSays = "Congrats you got that one right ";
        }else{
            alexaSays = "Better luck next time, the correct answer is "+qts[qts_position[qts_position.length-1]].correct_answer.toLowerCase();
        }
        
    }else{
        alexaSays = "Don't give up you will get the rest right!";
    }

    if(qts_given < qts.length && qts_given < NUM_MAX_QUESTIONS){
        qts_given++;
    }else{
        var points = data.points;
        points += qts_score;
        this.user().data.points = points;

        if(this.user().data.points >= 50 && this.user().data.points < 100){
            this.user().data.rank = rankings[1];
        }else if(this.user().data.points >= 100 && this.user().data.points < 150){
            this.user().data.rank = rankings[2];
        }else if(this.user().data.points >= 150 && this.user().data.points < 300){
            this.user().data.rank = rankings[3];
        }else if(this.user().data.points >= 300){
            this.user().data.rank = rankings[4];
        }
        
        var howManyCorrect = qts_score/5;

        if(howManyCorrect == NUM_MAX_QUESTIONS){
            this.ask("You got "+howManyCorrect+" out of "+qts_given+" questions correct! Excellent work, some more quizzes and you will be a master in no time. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }else if(howManyCorrect >= 3 && howManyCorrect < NUM_MAX_QUESTIONS){
            this.ask("You got "+howManyCorrect+" out of "+qts_given+" questions correct! Keep learning and doing quizzes and you will achieve the perfect score. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }else{
            this.ask("You got "+howManyCorrect+" out of "+qts_given+" questions correct! Don't feel bad just keep learning and you will soon have the perfect score. Want to keep doing quizzes or check your rank?"," Want to keep doing quizzes or check your rank?");
            return;
        }
        
    }

    var next_question = '';
    var ind = 0;

    do{
        ind = Math.floor(Math.random()*qts.length);
    }while(qts_position.includes(ind))

    qts_position.push(ind);

    if(this.getSessionAttribute("type") === "multiple choice" || this.getSessionAttribute("type") === "choice" 
       || this.getSessionAttribute("type") === "multiple" || this.getSessionAttribute("type") === "mult"){
        next_question = qts[ind].question;
        next_question += " ";
        next_question += qts[ind].incorrect_answers[0];
        next_question += ", ";
        next_question += qts[ind].correct_answer;
        next_question += ", ";
        next_question += qts[ind].incorrect_answers[1];
        next_question += ", ";
        next_question += qts[ind].incorrect_answers[2];
    }else{
        next_question = qts[ind].question;
    }

    this.setSessionAttribute("numQtsGiven",qts_given);
    this.setSessionAttribute("current_score",qts_score);
    this.setSessionAttribute("index",qts_position);
    this.setSessionAttribute("current_sentence",next_question);

    this.followUpState('QuizState').ask(alexaSays+". Next question: "+next_question,next_question);
}

module.exports.app = app;