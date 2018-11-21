const fs = require('fs');

function questionMaker(){
    fs.readFile('./jsonfiles/trivia_questions.json','utf8',(err,fc) => {
        if(err){
            console.log('Error: '+ err.message);
            return
        }
        
       const data = JSON.parse(fc);
       
       var res = data.results;
       var quizzes = {};

       for(var i in res){
        var question = {};
        var name = '';
        
        name += res[i].category;
        name += '_';
        name += res[i].type;
        name += '_';
        name += res[i].difficulty;
        
        if(!quizzes[name]){
            quizzes[name] = [];
        }

        question["question"] = res[i].question;
        question["correct_answer"] = res[i].correct_answer;
        question["incorrect_answers"] = res[i].incorrect_answers;

        quizzes[name].push(question);
       }

       fs.writeFile("question.json",JSON.stringify(quizzes,null,4), () => {} );

    })
}

questionMaker();