const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const connectEnsurelogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("hi hello"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(flash());
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my-super-secret-key-447575886",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid email" });
        });
    }
  )
);
passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", (request, response) => {
  if (request.user != undefined) {
    response.redirect("/todos");
  } else {
    response.render("index", {
      title: "Todo Application",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get(
  "/todos",
  connectEnsurelogin.ensureLoggedIn(),
  async function (request, response) {
    console.log(request.user);
    const loggedInUser = request.user.id;
    const overdue = await Todo.overdue(loggedInUser);
    const allTodos = await Todo.getTodos();
    const dueLater = await Todo.dueLater(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const completedItems = await Todo.completedItems(loggedInUser);
    if (request.accepts("html")) {
      response.render("todo", {
        allTodos,
        overdue,
        dueLater,
        dueToday,
        completedItems,
        csrfToken: request.csrfToken(),
        userFirstName: request.user.firstName,
        userLastName: request.user.lastName,
      });
    } else {
      response.json({
        overdue,
        duetoday: dueToday,
        dueLater,
      });
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});
app.post("/users", async (request, response) => {
  if (!request.body.firstName) {
    request.flash("error", "Please enter your first name");
    return response.redirect("/signup");
  }
  if (!request.body.email) {
    request.flash("error", "Please enter email ID");
    return response.redirect("/signup");
  }
  if (!request.body.password) {
    request.flash("error", "Please enter your password");
    return response.redirect("/signup");
  }
  if (request.body.password < 8) {
    request.flash("error", "Password length should be atleast 8");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    request.flash("error", "email already exists");
    response.redirect("/signup");
  }
});

// app.get("/todos", async function (_request, response) {
//   console.log("Processing list of all Todos ...");
//   // FILL IN YOUR CODE HERE
//   const allTodos = await Todo.findAll();
//   response.send(allTodos);
//   // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
//   // Then, we have to respond with all Todos, like:
//   // response.send(todos)
// });

app.get(
  "/todos/:id",
  connectEnsurelogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsurelogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      if (error.errors) {
        for (let i = 0; i < error.errors.length; i++) {
          request.flash("error", error.errors[i].message);
        }
      } else {
        request.flash("error", "Invalid Date");
      }
      return response.redirect("/todos");
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsurelogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsurelogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      const deletedCount = await Todo.destroy({
        where: {
          id: request.params.id,
        },
      });
      if (deletedCount) {
        response.send(true);
      } else {
        response.send(false);
      }
    } catch (error) {
      console.log(error);
    }
    // First, we have to query our database to delete a Todo by ID.
    // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
    // response.send(true)
  }
);
app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  }
);
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

module.exports = app;
