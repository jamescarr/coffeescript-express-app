$ ->
  S4 = ->
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring 1
  guid = ->
    S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4()
  class Store 
    constructor:(@name) ->
      store = localStorage.getItem(@name)
      @data = (store and JSON.parse(store)) or {}
  
    save: ->
      localStorage.setItem @name, JSON.stringify(@data)
    
    create: (model) ->
      model.id = model.attributes.id = guid()  unless model.id
      @data[model.id] = model
      @save()
      model
    
    update: (model) ->
      @data[model.id] = model
      @save()
      model
    
    find: (model) ->
      @data[model.id]
    
    findAll: ->
      _.values @data
    
    destroy: (model) ->
      delete @data[model.id]
      
      @save()
      model
    
  Backbone.sync = (method, model, options) ->
    store = model.localStorage or model.collection.localStorage
    switch method
      when "read"
        resp = (if model.id then store.find(model) else store.findAll())
      when "create"
        resp = store.create(model)
      when "update"
        resp = store.update(model)
      when "delete"
        resp = store.destroy(model)
    if resp
      options.success resp
    else
      options.error "Record not found"
  
  window.Todo = Backbone.Model.extend(
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
  )
  window.TodoList = Backbone.Collection.extend(
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
  )
  window.Todos = new TodoList
  window.TodoView = Backbone.View.extend(
    tagName: "li"
    template: _.template($("#item-template").html())
    events: 
      "click .check": "toggleDone"
      "dblclick div.todo-content": "edit"
      "click span.todo-destroy": "clear"
      "keypress .todo-input": "updateOnEnter"
    
    initialize: ->
      _.bindAll this, "render", "close"
      @model.bind "change", @render
      @model.view = this
    
    render: ->
      $(@el).html @template(@model.toJSON())
      @setContent()
      this
    
    setContent: ->
      content = @model.get("content")
      @$(".todo-content").text content
      @input = @$(".todo-input")
      @input.bind "blur", @close
      @input.val content
    
    toggleDone: ->
      @model.toggle()
    
    edit: ->
      $(@el).addClass "editing"
      @input.focus()
    
    close: ->
      @model.save content: @input.val()
      $(@el).removeClass "editing"
    
    updateOnEnter: (e) ->
      @close()  if e.keyCode == 13
    
    remove: ->
      $(@el).remove()
    
    clear: ->
      @model.clear()
  )
  window.AppView = Backbone.View.extend(
    el: $("#todoapp")
    statsTemplate: _.template($("#stats-template").html())
    events: 
      "keypress #new-todo": "createOnEnter"
      "keyup #new-todo": "showTooltip"
      "click .todo-clear a": "clearCompleted"
    
    initialize: ->
      _.bindAll this, "addOne", "addAll", "render"
      @input = @$("#new-todo")
      Todos.bind "add", @addOne
      Todos.bind "reset", @addAll
      Todos.bind "all", @render
      Todos.fetch()
    
    clearCompleted: ->
      _.each Todos.done(), (todo) ->
        todo.clear()
      
      false
    
    render: ->
      @$("#todo-stats").html @statsTemplate(
        total: Todos.length
        done: Todos.done().length
        remaining: Todos.remaining().length
      )
    
    addOne: (todo) ->
      view = new TodoView(model: todo)
      @$("#todo-list").append view.render().el
    
    addAll: ->
      Todos.each @addOne
    
    newAttributes: ->
      content: @input.val()
      order: Todos.nextOrder()
      done: false
    
    createOnEnter: (e) ->
      return  unless e.keyCode == 13
      Todos.create @newAttributes()
      @input.val ""
    
    showTooltip: (e) ->
      tooltip = @$(".ui-tooltip-top")
      val = @input.val()
      tooltip.fadeOut()
      clearTimeout(@tooltipTimeout) if @tooltipTimeout
      show = -> tooltip.show().fadeIn()
      
      @tooltipTimeout = _.delay(show, 1000)
  )
  window.App = new AppView
