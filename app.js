var express = require("express"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    flash = require("connect-flash");

var app = express();

// mongoose.connect("mongodb://localhost/fahamu_official");
mongoose.connect("mongodb://zeddyjere:redzilla@ds243805.mlab.com:43805/fahamu");
// mongodb://zeddyjere:redzilla@ds243805.mlab.com:43805/fahamu

// APP CONFIG
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());

// USER SCHEMA
var UserSchema = new mongoose.Schema({
    username: String,
    firstname: String,
    secondname: String,
    password: String,
    school: String,
    classname: String,
    gender: String,
    accountauth: String,
    results: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Result"
        }
    ]
})

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", UserSchema);

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Rusty is the cutest dog ever!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res, next) {
    res.locals.currentUser = req.user;
    next();
});

// SCHEMAS

var questionSchema = new mongoose.Schema({
    questionimage: String,
    questiontext: String,
    choiceA: String,
    choiceB: String,
    choiceC: String,
    choiceD: String,
    answer: String,
});

var Question = mongoose.model("Question", questionSchema);

// English question schema 
var e_questionSchema = new mongoose.Schema({
    passageView: String,
    questiontext: String,
    choiceA: String,
    choiceB: String,
    choiceC: String,
    choiceD: String,
    answer: String
})

var E_Question = mongoose.model("E_Question", e_questionSchema);

// User Result
var userResultSchema = new mongoose.Schema({
    testpaperName: String,
    testpaperSubject: String,
    className: String,
    result: String
})

var Result = mongoose.model("Result", userResultSchema);

// mathematics

var mathsSchema = new mongoose.Schema({
   testpaperName: String,
   className: String,
   questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ]
});

var Maths = mongoose.model("Maths", mathsSchema);

// english
var englishSchema = new mongoose.Schema({
    testpaperName: String,
    className: String,
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "E_Question"
        }
    ]
});

var English = mongoose.model("English", englishSchema);

// Kiswahili
var kiswahiliSchema = new mongoose.Schema({
    testpaperName: String,
    className: String,
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "E_Question"
        }
    ]
});

var Kiswahili = mongoose.model("Kiswahili", kiswahiliSchema);

// science
var scienceSchema = new mongoose.Schema({
    testpaperName: String,
    className: String,
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ]
});

var Science = mongoose.model("Science", scienceSchema);

// sst
var sstSchema = new mongoose.Schema({
    testpaperName: String,
    className: String,
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ]
})

var Sst = mongoose.model("Sst", sstSchema);


// =========================================================================== //
// =========================================================================== //
// =========================================================================== //

// ROUTES
app.get("/", function(req, res) {
    res.render("landing");
    console.log(req.user);
})

app.get("/feedback", function(req, res) {
    res.render("feedback")
})

app.get("/dashboard", isLoggedIn, function(req, res) {
    User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
        if(err) {
            console.log(err)
        } else {
            res.render("dashboard", {user: foundUser});
        }
    })
})

app.get("/subjects", isLoggedIn, function(req, res) {
    res.render("subjects");
})

// Mathematics Routes 

app.get("/subjects/maths", isLoggedIn, function(req, res) {
    Maths.find({}, function(err, foundMath) {
        if(err) {
            console.log(err)
        } else {
            res.render("maths", {maths: foundMath});
        }
    }).sort({_id:-1});
})

app.get("/subjects/maths/new", isLoggedIn, isDeveloper, function(req, res) {
    res.render("mathsnew");
})

app.post("/subjects/maths", isLoggedIn, isDeveloper, function(req, res) {
    Maths.create(req.body.maths, function(err, createdMath) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("maths")
        }
    })
})

app.get("/subjects/maths/:id", isLoggedIn, function(req, res) {
    Maths.findById(req.params.id).populate("questions").exec(function(err, foundMath) {
        if(err) {
            console.log(err)
        } else {
            User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
                if(err) {
                    console.log(err)
                } else {
                    res.render("quiz", {maths: foundMath, user: foundUser});
                }
            })
        }
    })
})

app.get("/subjects/maths/:id/questions/new", isLoggedIn, isDeveloper, function(req, res) {
    Maths.findById(req.params.id, function(err, foundMath) {
        if(err) {
            console.log(err)
        } else {
            res.render("mathsnewquestion", {maths: foundMath})
        }
    })
})

app.post("/subjects/maths/:id/questions", isLoggedIn, isDeveloper, function(req, res) {
    // find the actual testpaper
    Maths.findById(req.params.id, function(err, foundMath) {
        if(err) {
            console.log(err)
            res.redirect("/subjects")
        } else {
            // create the question
            Question.create(req.body.quiz, function(err, createdQuiz) {
                if(err) {
                    console.log(err)
                    res.redirect("back");
                } else {
                    createdQuiz.save();
                    foundMath.questions.push(createdQuiz);
                    foundMath.save();
                    res.redirect("/subjects/maths/" + req.params.id + "/questions/new");
                }
            })
        }
    })
})

app.get("/subjects/maths/:id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Maths.findById(req.params.id, function(err, foundMath) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.render("mathsedit", {maths: foundMath});
        }
    })
})

app.put("/subjects/maths/:id", isLoggedIn, isDeveloper, function(req, res) {
    Maths.findByIdAndUpdate(req.params.id, req.body.quiz, function(err, updatedMath) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/maths")
        }
    })
})

app.delete("/subjects/maths/:id", isLoggedIn, isDeveloper, function(req, res) {
    Maths.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/subjects/maths")
        }
    })
})

// Maths Questions Edit and Update and Delete Routes
app.get("/subjects/maths/:id/questions/:question_id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Question.findById(req.params.question_id, function(err, foundQuestion) {
        if(err) {
            console.log(err)
        } else {
            res.render("mathsquizedit", { maths_id: req.params.id , question: foundQuestion})
        }
    })
})

app.put("/subjects/maths/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndUpdate(req.params.question_id, req.body.quiz, function(err, updatedQuestion) {
        if(err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/subjects/maths/" + req.params.id);
        }
    })
})

app.delete("/subjects/maths/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndRemove(req.params.question_id, function(err) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/maths/" + req.params.id);
        }
    })
})

// English Routes 
app.get("/subjects/english", isLoggedIn, function(req, res) {
    English.find({}, function(err, foundEnglish) {
        if(err) {
            console.log(err)
        } else {
            res.render("english", {english: foundEnglish});
        }
    }).sort({_id:-1});
})

app.get("/subjects/english/new", isLoggedIn, isDeveloper, function(req, res) {
    res.render("englishnew");
})

app.post("/subjects/english", isLoggedIn, isDeveloper, function(req, res) {
    English.create(req.body.english, function(err, createdEnglish) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("english")
        }
    })
})

app.get("/subjects/english/:id", isLoggedIn, function(req, res) {
    English.findById(req.params.id).populate("questions").exec(function(err, foundEnglish) {
        if(err) {
            console.log(err)
        } else {
            User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
                if(err) {
                    console.log(err)
                } else {
                    res.render("englishquiz", {english: foundEnglish, user: foundUser});
                }
            })
        }
    })
})

app.get("/subjects/english/:id/edit", isLoggedIn, isDeveloper, function(req, res) {
    English.findById(req.params.id, function(err, foundEnglish) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.render("englishedit", {english: foundEnglish});
        }
    })
})

app.put("/subjects/english/:id", isLoggedIn, isDeveloper, function(req, res) {
    English.findByIdAndUpdate(req.params.id, req.body.quiz, function(err, updatedEnglish) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/english")
        }
    })
})

app.delete("/subjects/english/:id", isLoggedIn, isDeveloper, function(req, res) {
    English.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/subjects/english")
        }
    })
})

// English adding questions Route
app.get("/subjects/english/:id/questions/new", isLoggedIn, isDeveloper, function(req, res) {
    English.findById(req.params.id, function(err, foundEnglish) {
        if(err) {
            console.log(err)
        } else {
            res.render("englishnewquestion", {english: foundEnglish})
        }
    })
})

app.post("/subjects/english/:id/questions", isLoggedIn, isDeveloper, function(req, res) {
    // find the actual testpaper
    English.findById(req.params.id, function(err, foundEnglish) {
        if(err) {
            console.log(err)
            res.redirect("/subjects")
        } else {
            // create the question
            E_Question.create(req.body.quiz, function(err, createdQuiz) {
                if(err) {
                    console.log(err)
                    res.redirect("back");
                } else {
                    createdQuiz.save();
                    foundEnglish.questions.push(createdQuiz);
                    foundEnglish.save();
                    res.redirect("/subjects/english/" + req.params.id + "/questions/new");
                }
            })
        }
    })
})

app.get("/subjects/english/:id/questions/:question_id/edit", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findById(req.params.question_id, function(err, foundQuestion) {
        if(err) {
            console.log(err)
        } else {
            res.render("englishquizedit", { english_id: req.params.id , question: foundQuestion})
        }
    })
})

app.put("/subjects/english/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findByIdAndUpdate(req.params.question_id, req.body.quiz, function(err, updatedQuestion) {
        if(err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/subjects/english/" + req.params.id);
        }
    })
})

app.delete("/subjects/english/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findByIdAndRemove(req.params.question_id, function(err) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/english/" + req.params.id);
        }
    })
})

// Kiswahili Routes 
app.get("/subjects/kiswahili", isLoggedIn, function(req, res) {
    Kiswahili.find({}, function(err, foundKiswahili) {
        if(err) {
            console.log(err)
        } else {
            res.render("kiswahili", {kiswahili: foundKiswahili});
        }
    }).sort({_id:-1});
})

app.get("/subjects/kiswahili/new", isLoggedIn, isDeveloper, function(req, res) {
    res.render("kiswahilinew");
})

app.post("/subjects/kiswahili", isLoggedIn, isDeveloper, function(req, res) {
    Kiswahili.create(req.body.kiswahili, function(err, createdKiswahili) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("kiswahili")
        }
    })
})

app.get("/subjects/kiswahili/:id", isLoggedIn, function(req, res) {
    Kiswahili.findById(req.params.id).populate("questions").exec(function(err, foundKiswahili) {
        if(err) {
            console.log(err)
        } else {
            User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
                if(err) {
                    console.log(err)
                } else {
                    res.render("kiswahiliquiz", {kiswahili: foundKiswahili, user: foundUser});
                }
            })
        }
    })
})

app.get("/subjects/kiswahili/:id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Kiswahili.findById(req.params.id, function(err, foundKiswahili) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.render("kiswahiliedit", {kiswahili: foundKiswahili});
        }
    })
})

app.put("/subjects/kiswahili/:id", isLoggedIn, isDeveloper, function(req, res) {
    Kiswahili.findByIdAndUpdate(req.params.id, req.body.quiz, function(err, updatedKiswahili) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/kiswahili")
        }
    })
})

app.delete("/subjects/kiswahili/:id", isLoggedIn, isDeveloper, function(req, res) {
    Kiswahili.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/subjects/kiswahili")
        }
    })
})

// Kiswahili Adding questions Route
app.get("/subjects/kiswahili/:id/questions/new", isLoggedIn, isDeveloper, function(req, res) {
    Kiswahili.findById(req.params.id, function(err, foundKiswahili) {
        if(err) {
            console.log(err)
        } else {
            res.render("kiswahilinewquestion", {kiswahili: foundKiswahili})
        }
    })
})

app.post("/subjects/kiswahili/:id/questions", isLoggedIn, isDeveloper, function(req, res) {
    // find the actual testpaper
    Kiswahili.findById(req.params.id, function(err, foundKiswahili) {
        if(err) {
            console.log(err)
            res.redirect("/subjects")
        } else {
            // create the question
            E_Question.create(req.body.quiz, function(err, createdQuiz) {
                if(err) {
                    console.log(err)
                    res.redirect("back");
                } else {
                    createdQuiz.save();
                    foundKiswahili.questions.push(createdQuiz);
                    foundKiswahili.save();
                    res.redirect("/subjects/kiswahili/" + req.params.id + "/questions/new");
                }
            })
        }
    })
})

app.get("/subjects/kiswahili/:id/questions/:question_id/edit", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findById(req.params.question_id, function(err, foundQuestion) {
        if(err) {
            console.log(err)
        } else {
            res.render("kiswahiliquizedit", { kiswahili_id: req.params.id , question: foundQuestion})
        }
    })
})

app.put("/subjects/kiswahili/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findByIdAndUpdate(req.params.question_id, req.body.quiz, function(err, updatedQuestion) {
        if(err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/subjects/kiswahili/" + req.params.id);
        }
    })
})

app.delete("/subjects/kiswahili/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    E_Question.findByIdAndRemove(req.params.question_id, function(err) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/kiswahili/" + req.params.id);
        }
    })
})


// Science Routes
app.get("/subjects/science", isLoggedIn, function(req, res) {
    Science.find({}, function(err, foundScience) {
        if(err) {
            console.log(err)
        } else {
            res.render("science", {science: foundScience});
        }
    }).sort({_id:-1});
})

app.get("/subjects/science/new", isLoggedIn, isDeveloper, function(req, res) {
    res.render("sciencenew");
})

app.post("/subjects/science", isLoggedIn, isDeveloper, function(req, res) {
    Science.create(req.body.science, function(err, createdScience) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("science")
        }
    })
})

app.get("/subjects/science/:id", isLoggedIn, function(req, res) {
    Science.findById(req.params.id).populate("questions").exec(function(err, foundScience) {
        if(err) {
            console.log(err)
        } else {
            User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
                if(err) {
                    console.log(err)
                } else {
                    res.render("sciencequiz", {science: foundScience, user: foundUser});
                }
            })
        }
    })
})

app.get("/subjects/science/:id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Science.findById(req.params.id, function(err, foundScience) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.render("scienceedit", {science: foundScience});
        }
    })
})

app.put("/subjects/science/:id", isLoggedIn, isDeveloper, function(req, res) {
    Science.findByIdAndUpdate(req.params.id, req.body.quiz, function(err, updatedScience) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/science")
        }
    })
})

app.delete("/subjects/science/:id", isLoggedIn, isDeveloper, function(req, res) {
    Science.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/subjects/science")
        }
    })
})

// science add question routes
app.get("/subjects/science/:id/questions/new", isLoggedIn, isDeveloper, function(req, res) {
    Science.findById(req.params.id, function(err, foundScience) {
        if(err) {
            console.log(err)
        } else {
            res.render("sciencenewquestion", {science: foundScience})
        }
    })
})

app.post("/subjects/science/:id/questions", isLoggedIn, isDeveloper, function(req, res) {
    // find the actual testpaper
    Science.findById(req.params.id, function(err, foundScience) {
        if(err) {
            console.log(err)
            res.redirect("/subjects")
        } else {
            // create the question
            Question.create(req.body.quiz, function(err, createdQuiz) {
                if(err) {
                    console.log(err)
                    res.redirect("back");
                } else {
                    createdQuiz.save();
                    foundScience.questions.push(createdQuiz);
                    foundScience.save();
                    res.redirect("/subjects/science/" + req.params.id + "/questions/new");
                }
            })
        }
    })
})
app.get("/subjects/science/:id/questions/:question_id/edit", isDeveloper, isLoggedIn, function(req, res) {
    Question.findById(req.params.question_id, function(err, foundQuestion) {
        if(err) {
            console.log(err)
        } else {
            res.render("sciencequizedit", { science_id: req.params.id , question: foundQuestion})
        }
    })
})

app.put("/subjects/science/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndUpdate(req.params.question_id, req.body.quiz, function(err, updatedQuestion) {
        if(err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/subjects/science/" + req.params.id);
        }
    })
})

app.delete("/subjects/science/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndRemove(req.params.question_id, function(err) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/science/" + req.params.id);
        }
    })
})

// social studies Routes
app.get("/subjects/sst", isLoggedIn, function(req, res) {
    Sst.find({}, function(err, foundSst) {
        if(err) {
            console.log(err)
        } else {
            res.render("sst", {sst: foundSst});
        }
    }).sort({_id:-1});
})

app.get("/subjects/sst/new", isLoggedIn, isDeveloper, function(req, res) {
    res.render("sstnew");
})

app.post("/subjects/sst", isLoggedIn, isDeveloper, function(req, res) {
    Sst.create(req.body.sst, function(err, createdSst) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("sst")
        }
    })
})

app.get("/subjects/sst/:id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Sst.findById(req.params.id, function(err, foundSst) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.render("sstedit", {sst: foundSst});
        }
    })
})

app.put("/subjects/sst/:id", isLoggedIn, isDeveloper, function(req, res) {
    Sst.findByIdAndUpdate(req.params.id, req.body.quiz, function(err, updatedSst) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/sst")
        }
    })
})

app.delete("/subjects/sst/:id", isLoggedIn, isDeveloper, function(req, res) {
    Sst.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/subjects/sst")
        }
    })
})

// sst add question routes
app.get("/subjects/sst/:id", isLoggedIn, function(req, res) {
    Sst.findById(req.params.id).populate("questions").exec(function(err, foundSst) {
        if(err) {
            console.log(err)
        } else {
            User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
                if(err) {
                    console.log(err)
                } else {
                    res.render("sstquiz", {sst: foundSst, user: foundUser});
                }
            })
        }
    })
})

app.get("/subjects/sst/:id/questions/new", isLoggedIn, isDeveloper, function(req, res) {
    Sst.findById(req.params.id, function(err, foundSst) {
        if(err) {
            console.log(err)
        } else {
            res.render("sstnewquestion", {sst: foundSst})
        }
    })
})

app.post("/subjects/sst/:id/questions", isLoggedIn, isDeveloper, function(req, res) {
    // find the actual testpaper
    Sst.findById(req.params.id, function(err, foundSst) {
        if(err) {
            console.log(err)
            res.redirect("/subjects")
        } else {
            // create the question
            Question.create(req.body.quiz, function(err, createdQuiz) {
                if(err) {
                    console.log(err)
                    res.redirect("back");
                } else {
                    createdQuiz.save();
                    foundSst.questions.push(createdQuiz);
                    foundSst.save();
                    res.redirect("/subjects/sst/" + req.params.id + "/questions/new");
                }
            })
        }
    })
})
app.get("/subjects/sst/:id/questions/:question_id/edit", isLoggedIn, isDeveloper, function(req, res) {
    Question.findById(req.params.question_id, function(err, foundQuestion) {
        if(err) {
            console.log(err)
        } else {
            res.render("sstquizedit", { sst_id: req.params.id , question: foundQuestion})
        }
    })
})

app.put("/subjects/sst/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndUpdate(req.params.question_id, req.body.quiz, function(err, updatedQuestion) {
        if(err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/subjects/sst/" + req.params.id);
        }
    })
})

app.delete("/subjects/sst/:id/questions/:question_id", isLoggedIn, isDeveloper, function(req, res) {
    Question.findByIdAndRemove(req.params.question_id, function(err) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/subjects/sst/" + req.params.id);
        }
    })
})

// REGISTERING A DEVELOPER

    // var newUser = new User(
    //     {
    //         username: "geoffojal",
    //         firstname: "Geoffrey",
    //         secondname: "Ojal",
    //         school: "Softstudio",
    //         classname: "Class 7",
    //         gender: "Male",
    //         accountauth: "Dev"
    //     } 
    // );
    // User.register(newUser, "geoff1234" , function(err, createdUser) {
    //     if(err) {
    //         console.log(err)
    //     } else {
    //         console.log("created a new user");
    //         console.log(createdUser);
    //     }
    // });
    
// AUTH ROUTES


// login Routes 
app.get("/login", function(req, res) {
    res.render("login", {errormessage: req.flash("error")});
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
}) ,function(req, res) {
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

// Register Routes 
app.get("/register", function(req, res) {
    res.render("register", {errormessage: req.flash("error")});
})

app.post("/register", function(req, res) {
    var newUser = new User(
        {
            username: req.body.username,
            firstname: req.body.firstname,
            secondname: req.body.secondname,
            school: req.body.school,
            classname: req.body.classname,
            gender: req.body.gender
        }
    );
    User.register(newUser, req.body.password, function(err, createdUser) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/dashboard");
        });
    })
});



// Score Routes
app.get("/scores", function(req, res) {
    User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
        if(err) {
            console.log(err)
        } else {
            res.render("scores.ejs", {user: foundUser});
        }
    })
});

app.post("/scores", isLoggedIn, function(req, res) {
    // find the user
    User.findById(req.user._id, function(err, foundUser) {
        if(err) {
            console.log(err)
            res.redirect("back")
        } else {
            // create the results
            Result.create(req.body.test, function(err, createdResult) {
                if(err) {
                    console.log(err)
                    res.redirect("back")
                } else {
                    createdResult.save();
                    foundUser.results.push(createdResult);
                    foundUser.save();
                    // redirect to scores
                    res.redirect("/scores");
                }
            })
        }
    })
})

app.delete("/scores/:id", isLoggedIn, function(req, res) {
    Result.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect("/scores")
        }
    })
})

app.get("/competitions", isLoggedIn, function(req, res) {
    res.render("competitions");
})

app.get("/profile", isLoggedIn, function(req, res) {
    User.findById(req.user._id).sort({_id:-1}).populate("results").exec(function (err, foundUser) {
        if(err) {
            console.log(err)
        } else {
            res.render("profile", {user: foundUser});
        }
    })
})

app.put("/profile", isLoggedIn, function(req, res) {
    // find user first
    User.findByIdAndUpdate(req.user._id, req.body.user, function(err, foundUser) {
        if(err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/profile");
        }
    })
})

app.delete("/profile", isLoggedIn, function(req, res) {
    User.findByIdAndRemove(req.user._id, function(err) {
        if (err) {
            console.log(err)
            res.redirect("back");
        } else {
            res.redirect("/");
        }
    })
})

app.get("/management", isLoggedIn, isDeveloper, function(req, res) {
    User.find({}, function(err, foundUsers) {
        if(err) {
            console.log(err)
        } else {
            res.render("management", {user: foundUsers});
        }
    }).sort({_id:-1});
})

app.get("/subjects/maths", isLoggedIn, function(req, res) {
    Maths.find({}, function(err, foundMath) {
        if(err) {
            console.log(err)
        } else {
            res.render("maths", {maths: foundMath});
        }
    }).sort({_id:-1});
})

// Middleware
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Please Log in First!");
    res.redirect("/login");
};

function isDeveloper(req, res, next) {
    if(req.isAuthenticated()) {
        if(req.user.accountauth == "Dev" && req.user.accountauth != null) {
            next();
        } else {
            res.redirect("/dashboard");
        }
    }
}

// OPEN SERVER
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("The server has been started ...");
})

// $ mongodump -h localhost:27017 -d Loc8r -o ~/tmp/mongodump

//soft-studio-zeddyjere.c9users.io/scores

// mongorestore -h ds243805.mlab.com:43805 -d fahamu -u <user> -p <password> <input db directory>