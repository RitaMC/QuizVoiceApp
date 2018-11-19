const fs = require('fs');

function parser(){
    fs.readFile('./trivia_questions.json','utf8',(err,fc) => {
        if(err){
            console.log('Error: '+ err.message);
            return
        }
        
       const data = JSON.parse(fc);
       var res = data.results;
       var answers = [];

       for(var i in res){
            answers.push(res[i].correct_answer);
            answers.concat(res[i].incorrect_answers);
       }

       fs.writeFile("listofanswers.txt",JSON.stringify(answers,null,4),() => {});

    })
}

parser();