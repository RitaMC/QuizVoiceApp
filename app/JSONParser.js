const fs = require('fs');
const file = require('./jsonfiles/question.json');

function parser(){
       const keys = Object.keys(file);
       var answers = [];
       
       for(var i in keys){
            var key = keys[i];
            var res = file[key];

            for(var j  in res){
                if(!answers.includes(res[j].correct_answer)){
                    answers.push(res[j].correct_answer);
                }
                answers = answers.concat(res[j].incorrect_answers);
            }
       }
       answers = answers.filter((v, i, a) => a.indexOf(v) === i);
       fs.writeFile("listofanswers.txt",JSON.stringify(answers,null,4),() => {});

}

parser();