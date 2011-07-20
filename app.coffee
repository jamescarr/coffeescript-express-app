express = require("express")
stylus = require 'stylus'
app = module.exports = express.createServer()

app.configure ->
  publicDir = "#{__dirname}/public"
  viewsDir  = "#{__dirname}/views"
  coffeeDir = "#{viewsDir}/coffeescript"

  app.set "views", viewsDir
  app.set "view engine", "jade"
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.compiler(
    src: viewsDir, 
    dest: publicDir, 
    enable: ['coffeescript'])
  app.use(stylus.middleware debug: true, src: viewsDir, dest: publicDir, compile: compileMethod)
  app.use express.static(publicDir)



compileMethod = (str, path) ->
  stylus(str)
    .set('filename', path)
    .set('compress', true)


app.configure "development", ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )



app.configure "production", ->
  app.use express.errorHandler()

app.get "/", (req, res) ->
  res.render "index", title: "Backbone Todo App"

app.post '/save', (req, res) ->
  console.log req.body
  console.log req.params
  res.send req.xhr

app.listen 3000
console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env
