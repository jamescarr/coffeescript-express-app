window.Todo = Backbone.Model.extend
  defaults: 
    content: "empty todo..."
    done: false
  
  initialize: ->
    @set(content: @defaults.content)  unless @get("content")
  
  toggle: ->
    @save(done: not @get("done"))
  
  clear: ->
    @destroy()
    @view.remove()

window.TodoList = Backbone.Collection.extend
  model: Todo
  localStorage: new Store("todos")
  done: ->
    @filter (todo) ->
      todo.get "done"
  
  remaining: ->
    @without.apply this, @done()
  
  nextOrder: ->
    return 1  unless @length
    @last().get("order") + 1
  
  comparator: (todo) ->
    todo.get "order"

window.Todos = new TodoList
