var express = require("express");
//var bodyParser = require("body-parser");
//var cookieParser = require("cookie-parser");
var app = express();
var request = require("request");
var cheerio = require("cheerio");
app.set('view engine', 'ejs');
//app.use(bodyParser());
//app.use(cookieParser());
app.use(express.static('public'));
var fs = require("fs");

app.get("/", function(req,res) {
  res.render("home.ejs");
  
})

app.get("/history", function(req,res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  fs.readFile('history.txt', {}, function(err,data) {
    res.setHeader("Content-Type: text/plain");
    res.end(data);
    
  })
  
})

app.get("/answer", function(req,res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.query.text && req.query.text.length) {
    
    fs.appendFile("history.txt", req.query.text + "^_^");
    resText = "";
    request("http://bing.com?q=" + encodeURIComponent(req.query.text), function(err, resp, body) {
      if (err)
        throw err;
    
      $ = cheerio.load(body);
      
      var resText = $(".b_caption").slice(0,3);
      var URLtoFollow =   $(".b_caption").eq(0).find("cite").text();
      if (!URLtoFollow.trim().length) {
        return res.end("<dd class'user-q'>"+req.query.text+"</dd><dt class='server-a'>"        +      resText + "</dt>");
      }
      URLtoFollow = URLtoFollow.indexOf("http") !== -1 ? URLtoFollow : "http://" + URLtoFollow;
      console.log(URLtoFollow);
      var userQuery = req.query.text.toLowerCase()
      var lang = req.query.lang || "eng";
      userQuery = replaceStopWords(userQuery,lang);
      console.log(userQuery);
      userQuery = userQuery.split(" ");
      if (resText && resText.length) {
        var bestInputs  = [];
        request(URLtoFollow, function(err,bestRes,bestBody) {
          if (err) {
            return res.end("<dd class'user-q'>"+req.query.text+"</dd><dt class='server-a'>"        +      resText + "</dt>");
          }
          $$ = cheerio.load(bestBody.toLowerCase());
          for (var j = 0; j < userQuery.length;j++) {
            var matches = $$("p:contains(' "+userQuery[j]+" '),em:contains(' "+userQuery[j]+" '),b:contains(' "+userQuery[j]+" ' ),td:contains(' "+userQuery[j]+" ' ),li:contains(' "+userQuery[j]+" ' )").text();
            matches = matches.substr((matches.indexOf(userQuery[j]) - 50) % 1,((matches.indexOf(userQuery[j]) - 50) % 1) + 700 );
            bestInputs.push(matches);
          }
          
          bestInputs = bestInputs.filter(function(item) {
            if (item.trim() === "") {
              return false;
            }
            return true;
          })
          console.log("BESTINP" );
          console.log(bestInputs);
          var filteredInputs = [];
         for (var j = 0; j < bestInputs.length;j++) {
           if (j === 0) {    filteredInputs.push(bestInputs[j]); }
           if (filteredInputs.indexOf(bestInputs[j]) === -1)  {
             for (var z = 0; z < filteredInputs.length;z++) {
               if (bestInputs[j].indexOf(filteredInputs[z]) !== -1) {
                 console.log("none");
                 break;
               }
               if (z === filteredInputs.length-1) {

                 filteredInputs.push(bestInputs[j]);
               }
             }
           
           }
           
         }
       
        
          
        
        
          
         
    
          
          
          var pts = [];
          for (var j = 0; j < filteredInputs.length;j++) {
            
            for (var x = 0; x < userQuery.length;x++) {
              if (filteredInputs[j].indexOf(userQuery[x]) !== -1) {
                pts[j] = pts[j] ?  1 + pts[j] : 1;
              }
              else {
                pts[j] = pts[j] ?   pts[j] : 0;
              }
            }
            
          }
          console.log(pts);
          finalInputs = [];
          for (j = 0; j < 4;j++) {
            var bestpts  = pts.indexOf(Math.max(pts));
            if (pts[bestpts] < 1) {
              break;
            }
            pts.splice(bestpts,1);
            finalInputs.push(filteredInputs[j]);
          }
         
          
        
       
         
          resText = "<dd class'user-q'>"+req.query.text+"</dd><dt class='server-a'><p class='best-answer-crawled lead jumbotron'>" + finalInputs.join("</p><p class='best-answer-crawled lead jumbotron'>")  +  resText + "</dt>";
          res.end(resText);


        })
        
      }
      else {
        res.end("We cannot provide answer at this time :(");
      }
    
    


    
   
    
      // TODO: scraping goes here!
    });
  }
  
})

function replaceStopWords(text,lang) {
    if (lang === "eng") {
      text = text.replace(/\s/g, "  ");
      return text.replace(/ (a|about|above|after|against|all|am|an|and|any|are|aren't|as|at|be|because|been|before|being|below|between|both|but|by|can't|cannot|could|couldn't|did|didn't|do|does|doesn't|doing|don't|down|during|each|few|for|from|further|had|hadn't|has|hasn't|have|haven't|having|hehe|'d|he'll|he|here|here's|hers|herself|him|himselfh|is|how|how's|into|is|isn't|it|it's|its|itself|let's|me|more|most|mustn't|my|myself|no|nor|not|of|off|on|once|only|or|other|ought|our|ours|ourselves|out|over|own|same|she|she'd|she'll|she's|should|shouldn't|so|some|such|than|that|that's|the|their|theirs|them|themselves|then|there|there's|these|they|they'd|they'll|they're|they've|this|those|through|to|too|under|until|up|very|was|wasn't|we|we'd|we'll|we're|we've|were|weren't|what|what's|when|when's|where|where's|which|while|who|who's|whom|why|why's|with|won't|would|wouldn't|you|you'd|you'll|you're|you've|your|yours|who|yourself|yourselves) /g, " ");
    }
  
  else if (lang === "bul") {
    text = text.replace(/\s/g, "  ");
    return text.replace(/ (ли|е|а|обаче|въпреки|съм|но|може би|моля|аз|ала|та|че) /g)
  }
  
}

app.listen(process.env.PORT || 8080);