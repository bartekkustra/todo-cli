const fs = require('fs');
const path = require('path');
const os = require('os');

class TodoManager {
  constructor() {
    this.todoFile = path.join(os.homedir(), '.todos.json');
    this.ensureFileExists();
  }

  ensureFileExists() {
    if (!fs.existsSync(this.todoFile)) {
      fs.writeFileSync(this.todoFile, JSON.stringify([], null, 2));
    }
  }

  loadTodos() {
    try {
      const data = fs.readFileSync(this.todoFile, 'utf8');
      const todos = JSON.parse(data);
      // Migrate existing todos to new format
      return todos.map(todo => this.migrateTodo(todo));
    } catch (error) {
      return [];
    }
  }

  migrateTodo(todo) {
    // Add missing fields for backward compatibility
    return {
      id: todo.id,
      text: todo.text,
      completed: todo.completed || false,
      priority: todo.priority || 'medium',
      tags: todo.tags || (todo.category ? [todo.category] : ['global']),
      dueDate: todo.dueDate || null,
      createdAt: todo.createdAt || new Date().toISOString(),
      ...todo
    };
  }

  saveTodos(todos) {
    fs.writeFileSync(this.todoFile, JSON.stringify(todos, null, 2));
  }

  addTodo(text, priority = 'medium', tags = ['global'], dueDate = null) {
    const todos = this.loadTodos();
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
      priority: priority,
      tags: Array.isArray(tags) ? tags : [tags],
      dueDate: dueDate,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    this.saveTodos(todos);
    return newTodo;
  }

  addTodoFromString(input) {
    const parsed = this.parseNaturalLanguage(input);
    return this.addTodo(parsed.text, parsed.priority, parsed.tags, parsed.dueDate);
  }

  parseNaturalLanguage(input) {
    let text = input.trim();
    let priority = 'medium';
    let tags = ['global'];
    let dueDate = null;

    // Parse priority
    if (text.startsWith('!')) {
      priority = 'high';
      text = text.substring(1).trim();
    } else if (text.startsWith('_')) {
      priority = 'low';
      text = text.substring(1).trim();
    }

    // Parse tags (@tag)
    const tagMatches = text.match(/@(\w+)/g);
    if (tagMatches) {
      tags = tagMatches.map(tag => tag.substring(1));
      text = text.replace(/@\w+/g, '').trim();
    }

    // Parse due dates in parentheses
    const dueDateMatch = text.match(/\(([^)]+)\)$/);
    if (dueDateMatch) {
      const dateStr = dueDateMatch[1];
      dueDate = this.parseDueDate(dateStr);
      text = text.replace(/\([^)]+\)$/, '').trim();
    }

    return {
      text: text,
      priority: priority,
      tags: tags,
      dueDate: dueDate
    };
  }

  parseDueDate(dateStr) {
    const str = dateStr.toLowerCase().trim();
    const now = new Date();

    // Handle relative dates like "2d", "4w", etc.
    const relativeMatch = str.match(/^(\d+)([dwmy])$/);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2];
      const targetDate = new Date(now);

      switch (unit) {
        case 'd':
          targetDate.setDate(targetDate.getDate() + amount);
          break;
        case 'w':
          targetDate.setDate(targetDate.getDate() + (amount * 7));
          break;
        case 'm':
          targetDate.setMonth(targetDate.getMonth() + amount);
          break;
        case 'y':
          targetDate.setFullYear(targetDate.getFullYear() + amount);
          break;
      }
      return targetDate.toISOString().split('T')[0];
    }

    // Handle named dates
    if (str === 'today') {
      return now.toISOString().split('T')[0];
    } else if (str === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    } else if (str === 'next week' || str === '1 week') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // Handle YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(str)) {
      const testDate = new Date(str);
      if (!isNaN(testDate.getTime())) {
        return str;
      }
    }

    return null;
  }

  updateTodo(id, updates) {
    const todos = this.loadTodos();
    const todo = todos.find(t => t.id === parseInt(id));
    if (todo) {
      Object.assign(todo, updates);
      this.saveTodos(todos);
      return todo;
    }
    return null;
  }

  listTodos(options = {}) {
    let todos = this.loadTodos();

    // Filter by tag
    if (options.tag && options.tag !== 'all') {
      todos = todos.filter(t => t.tags && t.tags.includes(options.tag));
    }

    // Filter by priority
    if (options.priority && options.priority !== 'all') {
      todos = todos.filter(t => t.priority === options.priority);
    }

    // Filter by completion status
    if (options.completed !== undefined) {
      todos = todos.filter(t => t.completed === options.completed);
    }

    // Search text
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      todos = todos.filter(t => 
        t.text.toLowerCase().includes(searchLower) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Filter overdue
    if (options.overdue) {
      const now = new Date();
      todos = todos.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < now && 
        !t.completed
      );
    }

    // Sort todos
    if (options.sortBy) {
      todos = this.sortTodos(todos, options.sortBy);
    }

    return todos;
  }

  sortTodos(todos, sortBy) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    switch (sortBy) {
      case 'priority':
        return todos.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      case 'dueDate':
        return todos.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case 'tag':
        return todos.sort((a, b) => {
          const aTag = a.tags && a.tags.length > 0 ? a.tags[0] : 'zzz';
          const bTag = b.tags && b.tags.length > 0 ? b.tags[0] : 'zzz';
          return aTag.localeCompare(bTag);
        });
      case 'created':
        return todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'alphabetical':
        return todos.sort((a, b) => a.text.localeCompare(b.text));
      default:
        return todos;
    }
  }

  completeTodo(id) {
    const todos = this.loadTodos();
    const todo = todos.find(t => t.id === parseInt(id));
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) {
        todo.completedAt = new Date().toISOString();
      } else {
        delete todo.completedAt;
      }
      this.saveTodos(todos);
      return todo;
    }
    return null;
  }

  deleteTodo(id) {
    const todos = this.loadTodos();
    const index = todos.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      const deleted = todos.splice(index, 1)[0];
      this.saveTodos(todos);
      return deleted;
    }
    return null;
  }

  clearCompleted() {
    const todos = this.loadTodos();
    const remaining = todos.filter(t => !t.completed);
    const cleared = todos.length - remaining.length;
    this.saveTodos(remaining);
    return cleared;
  }

  getTags() {
    const todos = this.loadTodos();
    const allTags = todos.reduce((acc, todo) => {
      if (todo.tags) {
        acc.push(...todo.tags);
      }
      return acc;
    }, []);
    return [...new Set(allTags)].sort();
  }

  getOverdueTodos() {
    const now = new Date();
    return this.listTodos().filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      !t.completed
    );
  }

  getStatistics() {
    const todos = this.loadTodos();
    const completed = todos.filter(t => t.completed).length;
    const pending = todos.length - completed;
    const overdue = this.getOverdueTodos().length;
    
    const byPriority = {
      high: todos.filter(t => t.priority === 'high' && !t.completed).length,
      medium: todos.filter(t => t.priority === 'medium' && !t.completed).length,
      low: todos.filter(t => t.priority === 'low' && !t.completed).length
    };

    const byTag = {};
    this.getTags().forEach(tag => {
      byTag[tag] = todos.filter(t => t.tags && t.tags.includes(tag) && !t.completed).length;
    });

    return {
      total: todos.length,
      completed,
      pending,
      overdue,
      byPriority,
      byTag
    };
  }

  isOverdue(todo) {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date();
  }

  getDueSoon(days = 3) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.listTodos().filter(t => 
      t.dueDate && 
      !t.completed &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= futureDate
    );
  }
}

module.exports = TodoManager;