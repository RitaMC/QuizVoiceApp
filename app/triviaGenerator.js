var https = require('https');
var readline = require('readline');
var fs = require('fs');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function generator(data){
    var params = data.split(",");
    var theme = 0;

    if(params[1] === "General Knowledge"){
        theme = 9;    
    }else if(params[1] === "Sports"){
        theme = 21;
    }else if(params[1] === "Music"){
        theme = 12;
    }else if(params[1] === "Film"){
        theme = 11;
    }else if(params[1] === "Science and Nature"){
        theme = 17;
    }else if(params[1] === "Geography"){
        theme = 22;
    }

    var diff = params[2];
    var type = " ";

    if(params[3] === "Multiple choice"){
        type = "multiple";
    }else if(params[3] === "True or False"){
        type = "boolean";
    }


    var path = 'https://opentdb.com/api.php?amount='+params[0]+'&category='+theme.toString()+'&difficulty='+diff+'&type='+type;
    console.log(path);
    https.get(path, (resp) => {
        var data = '';

        resp.on('data',(chunk) => {
            data += chunk;
        });

        resp.on('end',() => {
            jdata = JSON.parse(data);

            fs.writeFile('trivia_questions.json',JSON.stringify(jdata,null,4),{'flag':'a'},(err) => {
                if (err){
                    console.log(err.message);
                } 
            });
          
            console.log("Json file created");
        })
    }).on("error",(err) =>{
        console.log("Error: "+ err.message);
    });
}

rl.question('Enter the parameters: ', function(d){
    rl.close();
    generator(d.toString().trim());
});
