(function() {
  $(function() {
    window.TodoView = Backbone.View.extend({
      tagName: "li",
      template: _.template($("#item-template").html()),
      events: {
        "click .check": "toggleDone",
        "dblclick div.todo-content": "edit",
        "click span.todo-destroy": "clear",
        "keypress .todo-input": "updateOnEnter"
      },
      initialize: function() {
        _.bindAll(this, "render", "close");
        this.model.bind("change", this.render);
        return this.model.view = this;
      },
      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        this.setContent();
        return this;
      },
      setContent: function() {
        var content;
        content = this.model.get("content");
        this.$(".todo-content").text(content);
        this.input = this.$(".todo-input");
        this.input.bind("blur", this.close);
        return this.input.val(content);
      },
      toggleDone: function() {
        return this.model.toggle();
      },
      edit: function() {
        $(this.el).addClass("editing");
        return this.input.focus();
      },
      close: function() {
        this.model.save({
          content: this.input.val()
        });
        return $(this.el).removeClass("editing");
      },
      updateOnEnter: function(e) {
        if (e.keyCode === 13) {
          return this.close();
        }
      },
      remove: function() {
        return $(this.el).remove();
      },
      clear: function() {
        return this.model.clear();
      }
    });
    window.AppView = Backbone.View.extend({
      el: $("#todoapp"),
      statsTemplate: _.template($("#stats-template").html()),
      events: {
        "keypress #new-todo": "createOnEnter",
        "keyup #new-todo": "showTooltip",
        "click .todo-clear a": "clearCompleted"
      },
      initialize: function() {
        _.bindAll(this, "addOne", "addAll", "render");
        this.input = this.$("#new-todo");
        Todos.bind("add", this.addOne);
        Todos.bind("reset", this.addAll);
        Todos.bind("all", this.render);
        return Todos.fetch();
      },
      clearCompleted: function() {
        _.each(Todos.done(), function(todo) {
          return todo.clear();
        });
        return false;
      },
      render: function() {
        return this.$("#todo-stats").html(this.statsTemplate({
          total: Todos.length,
          done: Todos.done().length,
          remaining: Todos.remaining().length
        }));
      },
      addOne: function(todo) {
        var view;
        view = new TodoView({
          model: todo
        });
        return this.$("#todo-list").append(view.render().el);
      },
      addAll: function() {
        return Todos.each(this.addOne);
      },
      newAttributes: function() {
        return {
          content: this.input.val(),
          order: Todos.nextOrder(),
          done: false
        };
      },
      createOnEnter: function(e) {
        if (e.keyCode !== 13) {
          return;
        }
        Todos.create(this.newAttributes());
        return this.input.val("");
      },
      showTooltip: function(e) {
        var show, tooltip, val;
        tooltip = this.$(".ui-tooltip-top");
        val = this.input.val();
        tooltip.fadeOut();
        if (this.tooltipTimeout) {
          clearTimeout(this.tooltipTimeout);
        }
        show = function() {
          return tooltip.show().fadeIn();
        };
        return this.tooltipTimeout = _.delay(show, 1000);
      }
    });
    return window.App = new AppView;
  });
}).call(this);
