$ ->
  
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
