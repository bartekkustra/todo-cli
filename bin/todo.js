#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const TodoManager = require('../lib/todoManager');
const readline = require('readline');

// Custom raw keypress handler for immediate shortcuts

class TodoApp {
  constructor() {
    this.todoManager = new TodoManager();
    this.running = true;
    this.currentFilters = {};
    this.debugMode = process.argv.includes('--debug');
  }

  async start() {
    console.log(chalk.bold.blue('\n🗒️  Todo CLI - Natural Language Edition\n'));
    
    // Force debug for testing
    console.log('DEBUG: process.argv =', process.argv);
    console.log('DEBUG: debugMode =', this.debugMode);
    
    if (this.debugMode) {
      console.log(chalk.yellow('🐛 DEBUG MODE ENABLED - Press keys to see debug output\n'));
    }
    
    while (this.running) {
      await this.showTodoList();
    }
    
    console.log(chalk.green('\n👋 Goodbye!\n'));
  }

  getPriorityIcon(priority) {
    switch (priority) {
      case 'high': return chalk.red('🔴');
      case 'medium': return chalk.yellow('🟡');
      case 'low': return chalk.green('🟢');
      default: return '⚪';
    }
  }

  formatTags(tags) {
    if (!tags || tags.length === 0) return '';
    return tags.map(tag => chalk.cyan(`@${tag}`)).join(' ');
  }

  formatDueDate(dueDate) {
    if (!dueDate) return '';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return chalk.red(` ⚠️  Overdue (${Math.abs(diffDays)}d)`);
    } else if (diffDays === 0) {
      return chalk.yellow(' 📅 Today');
    } else if (diffDays === 1) {
      return chalk.yellow(' 📅 Tomorrow');
    } else if (diffDays <= 7) {
      return chalk.blue(` 📅 ${diffDays}d`);
    } else {
      return chalk.gray(` 📅 ${due.toLocaleDateString()}`);
    }
  }

  formatTodo(todo, showTags = false) {
    const completionIcon = todo.completed ? chalk.green('✅') : chalk.red('⭕');
    const priorityIcon = this.getPriorityIcon(todo.priority);
    const tags = showTags ? this.formatTags(todo.tags) : '';
    const dueDate = this.formatDueDate(todo.dueDate);
    
    let text = todo.text;
    if (todo.completed) {
      text = chalk.strikethrough.gray(text);
    } else if (this.todoManager.isOverdue(todo)) {
      text = chalk.red(text);
    }

    const tagsAndDate = [tags, dueDate].filter(x => x).join('');
    return `${completionIcon} ${priorityIcon} ${text}${tagsAndDate}`;
  }

  groupTodosByTag(todos) {
    const grouped = {};
    todos.forEach(todo => {
      const mainTag = todo.tags && todo.tags.length > 0 ? todo.tags[0] : 'global';
      if (!grouped[mainTag]) {
        grouped[mainTag] = [];
      }
      grouped[mainTag].push(todo);
    });
    
    // Sort todos within each group by priority (high->medium->low) then by due date
    Object.keys(grouped).forEach(tag => {
      grouped[tag].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        
        // First sort by priority
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by due date (earliest first, no due date goes to end)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    });
    
    return grouped;
  }

  async showTodoList() {
    const stats = this.todoManager.getStatistics();
    const todos = this.todoManager.listTodos(this.currentFilters);
    const overdue = this.todoManager.getOverdueTodos().length;

    if (!this.debugMode) {
      console.clear();
    }
    console.log(chalk.bold.blue('🗒️  Todo CLI'));
    
    if (this.debugMode) {
      console.log(chalk.yellow('🐛 DEBUG MODE - process.argv:'), process.argv);
      console.log(chalk.yellow('🐛 DEBUG MODE - debugMode:'), this.debugMode);
    }
    
    // Show statistics
    let statusLine = chalk.gray(`📋 ${stats.pending} pending, ${stats.completed} completed`);
    if (overdue > 0) {
      statusLine += chalk.red(`, ${overdue} overdue`);
    }
    if (Object.keys(this.currentFilters).length > 0) {
      statusLine += chalk.blue(' (filtered)');
    }
    console.log(statusLine);

    console.log('');

    if (todos.length === 0) {
      if (Object.keys(this.currentFilters).length > 0) {
        console.log(chalk.gray('📭 No todos match your current filters.\n'));
      } else {
        console.log(chalk.gray('📭 No todos yet!\n'));
      }
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📝 Add new todo', value: 'add' },
            { name: '🔍 Filter & search', value: 'filter' },
            { name: '⚙️  Options', value: 'options' },
            { name: '🚪 Quit', value: 'quit' }
          ]
        }
      ]);

      await this.handleMenuAction(action);
      return;
    }

    // Use custom interactive navigation for in-place toggling
    await this.showCustomTodoList(todos);
  }

  async showCustomTodoList(todos) {
    // Group todos by tag
    const groupedTodos = this.groupTodosByTag(todos);
    const displayItems = [];
    
    // Build display structure
    const sortedTags = Object.keys(groupedTodos).sort((a, b) => {
      if (a === 'global') return -1;
      if (b === 'global') return 1;
      return a.localeCompare(b);
    });
    
    sortedTags.forEach((tag, tagIndex) => {
      if (Object.keys(groupedTodos).length > 1) {
        if (tagIndex > 0) {
          displayItems.push({ type: 'separator', text: '' });
        }
        displayItems.push({ type: 'separator', text: `━━━ @${tag} ━━━` });
      }
      
      groupedTodos[tag].forEach(todo => {
        displayItems.push({ 
          type: 'todo', 
          todo: todo, 
          text: this.formatTodo(todo),
          id: todo.id
        });
      });
    });

    // Add action items
    displayItems.push({ type: 'separator', text: '' });
    displayItems.push({ type: 'separator', text: '━━━ Actions ━━━' });
    displayItems.push({ type: 'action', action: 'add', text: '📝 Add new todo' });
    displayItems.push({ type: 'action', action: 'filter', text: '🔍 Filter & search' });
    displayItems.push({ type: 'action', action: 'edit', text: '✏️  Edit mode (bulk operations)' });
    displayItems.push({ type: 'action', action: 'options', text: '⚙️  Options' });
    displayItems.push({ type: 'action', action: 'quit', text: '🚪 Quit' });

    console.log(chalk.bold('Your Todos:\n'));

    // Show natural language examples
    if (todos.length < 3) {
      console.log(chalk.gray('💡 Natural Language Examples:'));
      console.log(chalk.gray('   "!Fix critical bug (2d)"     - High priority, due in 2 days'));
      console.log(chalk.gray('   "_Clean desk @home"          - Low priority, tagged "home"'));
      console.log(chalk.gray('   "Meeting prep (2024-12-25)"  - Medium priority, specific date'));
      console.log('');
    }

    // Start custom navigation
    await this.handleCustomNavigation(displayItems);
  }

  async handleCustomNavigation(items) {
    let currentIndex = 0;
    
    // Find first selectable item
    while (currentIndex < items.length && items[currentIndex].type === 'separator') {
      currentIndex++;
    }

    // Render initial list
    this.renderItemList(items, currentIndex);
    
    // Set up terminal for raw input
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    
    return new Promise((resolve) => {
      const handleKeypress = (chunk) => {
        const key = chunk.toString();
        
        if (key === '\u001b[A') { // Up arrow
          currentIndex = this.getPreviousSelectableIndex(items, currentIndex);
          this.updateSelection(items, currentIndex);
        } else if (key === '\u001b[B') { // Down arrow
          currentIndex = this.getNextSelectableIndex(items, currentIndex);
          this.updateSelection(items, currentIndex);
        } else if (key === '\r' || key === '\n') { // Enter
          const selectedItem = items[currentIndex];
          if (selectedItem.type === 'todo') {
            // Toggle todo in-place
            this.toggleTodoInPlace(selectedItem, currentIndex, items);
          } else if (selectedItem.type === 'action') {
            this.cleanup();
            this.handleMenuAction(selectedItem.action).then(() => resolve());
            return;
          }
        } else if (key === 'n') { // New todo shortcut
          this.cleanup();
          this.handleMenuAction('add').then(() => resolve());
          return;
        } else if (key === 'f') { // Filter shortcut
          this.cleanup();
          this.handleMenuAction('filter').then(() => resolve());
          return;
        } else if (key === 'e') { // Edit mode shortcut
          this.cleanup();
          this.handleMenuAction('edit').then(() => resolve());
          return;
        } else if (key === 'o') { // Options shortcut
          this.cleanup();
          this.handleMenuAction('options').then(() => resolve());
          return;
        } else if (key === '\u001b' || key === 'q') { // ESC or q
          this.cleanup();
          resolve();
          return;
        } else if (key === '\u0003') { // Ctrl+C
          this.cleanup();
          this.running = false;
          resolve();
          return;
        }
      };

      this.cleanup = () => {
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        process.stdin.pause();
        process.stdin.removeListener('data', handleKeypress);
      };

      process.stdin.on('data', handleKeypress);
    });
  }

  renderItemList(items, selectedIndex) {
    const terminalWidth = process.stdout.columns || 80;
    
    items.forEach((item, index) => {
      if (item.type === 'separator') {
        // Handle separator wrapping
        const text = chalk.gray(item.text);
        this.printWithWrapping(text, terminalWidth);
      } else {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '❯ ' : '  ';
        const fullLine = prefix + item.text;
        this.printWithWrapping(fullLine, terminalWidth);
      }
    });
    
    console.log(''); // Empty line
    const instructionText = chalk.gray('↑↓ arrows, ENTER to toggle | n:new, f:filter, e:edit, o:options | ESC/q:refresh');
    this.printWithWrapping(instructionText, terminalWidth);
  }
  
  printWithWrapping(text, terminalWidth) {
    // For now, just use console.log but we could implement proper wrapping here
    // The terminal will handle the wrapping automatically
    console.log(text);
  }

  getPreviousSelectableIndex(items, currentIndex) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (items[i].type !== 'separator') {
        return i;
      }
    }
    // Wrap to end
    for (let i = items.length - 1; i > currentIndex; i--) {
      if (items[i].type !== 'separator') {
        return i;
      }
    }
    return currentIndex;
  }

  getNextSelectableIndex(items, currentIndex) {
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (items[i].type !== 'separator') {
        return i;
      }
    }
    // Wrap to beginning
    for (let i = 0; i < currentIndex; i++) {
      if (items[i].type !== 'separator') {
        return i;
      }
    }
    return currentIndex;
  }

  updateSelection(items, newIndex) {
    // Simple approach: clear screen and re-render everything
    // This avoids complex cursor positioning issues with line wrapping
    if (!this.debugMode) {
      console.clear();
    }
    
    // Re-render header
    console.log(chalk.bold.blue('🗒️  Todo CLI'));
    
    if (this.debugMode) {
      console.log(chalk.yellow('🐛 DEBUG MODE - process.argv:'), process.argv);
      console.log(chalk.yellow('🐛 DEBUG MODE - debugMode:'), this.debugMode);
    }
    
    // Re-render stats (we'll need to pass this info)
    this.renderStatsHeader();
    
    console.log('');
    console.log(chalk.bold('Your Todos:\n'));
    
    // Show natural language examples if few todos
    const todoCount = items.filter(item => item.type === 'todo').length;
    if (todoCount < 3) {
      console.log(chalk.gray('💡 Natural Language Examples:'));
      console.log(chalk.gray('   "!Fix critical bug (2d)"     - High priority, due in 2 days'));
      console.log(chalk.gray('   "_Clean desk @home"          - Low priority, tagged "home"'));
      console.log(chalk.gray('   "Meeting prep (2024-12-25)"  - Medium priority, specific date'));
      console.log('');
    }
    
    // Re-render the list
    this.renderItemList(items, newIndex);
  }
  
  renderStatsHeader() {
    // Get fresh stats
    const stats = this.todoManager.getStatistics();
    const overdue = this.todoManager.getOverdueTodos().length;
    
    let statusLine = chalk.gray(`📋 ${stats.pending} pending, ${stats.completed} completed`);
    if (overdue > 0) {
      statusLine += chalk.red(`, ${overdue} overdue`);
    }
    if (Object.keys(this.currentFilters).length > 0) {
      statusLine += chalk.blue(' (filtered)');
    }
    console.log(statusLine);
  }
  
  stripAnsiCodes(str) {
    // Remove ANSI escape codes to get actual text length
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  }

  toggleTodoInPlace(selectedItem, itemIndex, items) {
    // Toggle the todo
    const updated = this.todoManager.completeTodo(selectedItem.id);
    
    // Update the item in place
    selectedItem.todo = updated;
    selectedItem.text = this.formatTodo(updated);
    
    // Simple approach: just re-render the whole list with the updated item
    // This ensures correct positioning and avoids cursor calculation issues
    this.updateSelection(items, itemIndex);
  }


  async waitForKeypress() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press ENTER to continue...'
      }
    ]);
  }



  async handleMenuAction(action) {
    switch (action) {
      case 'add':
        await this.addTodo();
        break;
      case 'filter':
        await this.filterTodos();
        break;
      case 'edit':
        await this.editMode();
        break;
      case 'options':
        await this.showOptions();
        break;
      case 'quit':
        this.running = false;
        break;
    }
  }

  async addTodo() {
    console.clear();
    console.log(chalk.bold.blue('📝 Add New Todo\n'));
    
    console.log(chalk.gray('Natural Language Format:'));
    console.log(chalk.gray('  !     = High priority'));
    console.log(chalk.gray('  _     = Low priority'));
    console.log(chalk.gray('  @tag  = Add tag'));
    console.log(chalk.gray('  (2d)  = Due in 2 days'));
    console.log(chalk.gray('  (2025-07-01) = Due on specific date'));
    console.log('');
    console.log(chalk.yellow('Examples:'));
    console.log(chalk.gray('  !Fix critical bug (2d) @work'));
    console.log(chalk.gray('  _Clean desk @home'));
    console.log(chalk.gray('  Meeting prep (tomorrow) @work'));
    console.log('');

    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Enter your todo:',
        validate: input => input.trim() ? true : 'Please enter a todo item'
      }
    ]);

    if (input.trim()) {
      const todo = this.todoManager.addTodoFromString(input.trim());
      console.log(chalk.green('\n✅ Added todo:'));
      console.log(this.formatTodo(todo));
      
      // Show what was parsed
      console.log(chalk.gray('\nParsed:'));
      console.log(chalk.gray(`  Priority: ${todo.priority}`));
      console.log(chalk.gray(`  Tags: ${todo.tags.join(', ')}`));
      if (todo.dueDate) {
        console.log(chalk.gray(`  Due: ${todo.dueDate}`));
      }
      
      setTimeout(() => {}, 2000);
    }
  }

  async filterTodos() {
    console.clear();
    console.log(chalk.bold.blue('🔍 Filter & Search\n'));

    const tags = ['all', ...this.todoManager.getTags()];
    const tagChoices = tags.map(tag => ({
      name: tag === 'all' ? 'All Tags' : `@${tag}`,
      value: tag
    }));

    const questions = [
      {
        type: 'input',
        name: 'search',
        message: 'Search text (leave empty for no search):',
        default: this.currentFilters.search || ''
      },
      {
        type: 'list',
        name: 'tag',
        message: 'Filter by tag:',
        choices: tagChoices,
        default: this.currentFilters.tag || 'all'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Filter by priority:',
        choices: [
          { name: 'All Priorities', value: 'all' },
          { name: '🔴 High', value: 'high' },
          { name: '🟡 Medium', value: 'medium' },
          { name: '🟢 Low', value: 'low' }
        ],
        default: this.currentFilters.priority || 'all'
      },
      {
        type: 'list',
        name: 'status',
        message: 'Filter by status:',
        choices: [
          { name: 'All todos', value: 'all' },
          { name: 'Pending only', value: 'pending' },
          { name: 'Completed only', value: 'completed' },
          { name: 'Overdue only', value: 'overdue' }
        ],
        default: 'all'
      },
      {
        type: 'list',
        name: 'sortBy',
        message: 'Sort by:',
        choices: [
          { name: 'Default order', value: null },
          { name: '🔴 Priority (High to Low)', value: 'priority' },
          { name: '📅 Due Date (Earliest first)', value: 'dueDate' },
          { name: '🏷️  Tag', value: 'tag' },
          { name: '🆕 Recently Created', value: 'created' },
          { name: '🔤 Alphabetical', value: 'alphabetical' }
        ],
        default: this.currentFilters.sortBy || null
      }
    ];

    const filters = await inquirer.prompt(questions);

    // Build filter object
    this.currentFilters = {};
    
    if (filters.search.trim()) {
      this.currentFilters.search = filters.search.trim();
    }
    
    if (filters.tag !== 'all') {
      this.currentFilters.tag = filters.tag;
    }
    
    if (filters.priority !== 'all') {
      this.currentFilters.priority = filters.priority;
    }
    
    if (filters.status === 'pending') {
      this.currentFilters.completed = false;
    } else if (filters.status === 'completed') {
      this.currentFilters.completed = true;
    } else if (filters.status === 'overdue') {
      this.currentFilters.overdue = true;
    }

    if (filters.sortBy) {
      this.currentFilters.sortBy = filters.sortBy;
    }

    const activeFilters = Object.keys(this.currentFilters).length;
    if (activeFilters > 0) {
      console.log(chalk.green(`\n🔍 ${activeFilters} filter(s) applied!`));
    } else {
      console.log(chalk.blue('\n🔄 All filters cleared!'));
    }

    setTimeout(() => {}, 1000);
  }

  async editMode() {
    const todos = this.todoManager.listTodos(this.currentFilters);
    
    if (todos.length === 0) {
      console.log(chalk.gray('\n📭 No todos found with current filters.'));
      setTimeout(() => {}, 1000);
      return;
    }

    console.clear();
    console.log(chalk.bold.blue('✏️  Edit Mode - Bulk Operations\n'));

    const choices = todos.map(todo => ({
      name: this.formatTodo(todo),
      value: todo.id,
      checked: false
    }));

    const { selectedIds } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedIds',
        message: 'Select todos for bulk operations (SPACE to select, ENTER to confirm):',
        choices: choices,
        pageSize: 15
      }
    ]);

    if (selectedIds.length === 0) {
      console.log(chalk.gray('\n❌ No items selected.'));
      setTimeout(() => {}, 1000);
      return;
    }

    const { bulkAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'bulkAction',
        message: `What would you like to do with ${selectedIds.length} selected item(s)?`,
        choices: [
          { name: '✅ Mark all as completed', value: 'complete' },
          { name: '⭕ Mark all as pending', value: 'uncomplete' },
          { name: '🔴 Set priority to High', value: 'priority-high' },
          { name: '🟡 Set priority to Medium', value: 'priority-medium' },
          { name: '🟢 Set priority to Low', value: 'priority-low' },
          { name: '🗑️  Delete all selected', value: 'delete' },
          { name: '🔙 Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (bulkAction === 'cancel') return;

    let count = 0;
    selectedIds.forEach(id => {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      switch (bulkAction) {
        case 'complete':
          if (!todo.completed) {
            this.todoManager.completeTodo(id);
            count++;
          }
          break;
        case 'uncomplete':
          if (todo.completed) {
            this.todoManager.completeTodo(id);
            count++;
          }
          break;
        case 'priority-high':
          this.todoManager.updateTodo(id, { priority: 'high' });
          count++;
          break;
        case 'priority-medium':
          this.todoManager.updateTodo(id, { priority: 'medium' });
          count++;
          break;
        case 'priority-low':
          this.todoManager.updateTodo(id, { priority: 'low' });
          count++;
          break;
        case 'delete':
          this.todoManager.deleteTodo(id);
          count++;
          break;
      }
    });

    const actionText = {
      'complete': 'completed',
      'uncomplete': 'marked as pending',
      'priority-high': 'set to high priority',
      'priority-medium': 'set to medium priority',
      'priority-low': 'set to low priority',
      'delete': 'deleted'
    };

    console.log(chalk.green(`\n✅ ${count} todo(s) ${actionText[bulkAction]}!`));
    setTimeout(() => {}, 1200);
  }

  async showOptions() {
    console.clear();
    console.log(chalk.bold.blue('⚙️  Options\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Choose an option:',
        choices: [
          { name: '🗑️  Clear completed todos', value: 'clear' },
          { name: '📊 Show statistics', value: 'stats' },
          { name: '🏷️  Show all tags', value: 'tags' },
          { name: '🔄 Clear all filters', value: 'clearFilters' },
          { name: '💡 Show help', value: 'help' },
          { name: '🔙 Back to todos', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'clear':
        await this.clearCompleted();
        break;
      case 'stats':
        await this.showStatistics();
        break;
      case 'tags':
        await this.showTags();
        break;
      case 'clearFilters':
        this.currentFilters = {};
        console.log(chalk.blue('\n🔄 All filters cleared!'));
        setTimeout(() => {}, 1000);
        break;
      case 'help':
        await this.showHelp();
        break;
      case 'back':
        break;
    }
  }

  async clearCompleted() {
    const cleared = this.todoManager.clearCompleted();
    if (cleared > 0) {
      console.log(chalk.green(`\n🗑️  Cleared ${cleared} completed todo(s)!`));
    } else {
      console.log(chalk.gray('\n📭 No completed todos to clear.'));
    }
    setTimeout(() => {}, 1200);
  }

  async showStatistics() {
    const stats = this.todoManager.getStatistics();
    console.clear();
    console.log(chalk.bold.blue('📊 Statistics\n'));
    
    console.log(chalk.bold('Overview:'));
    console.log(`  Total todos: ${stats.total}`);
    console.log(`  Pending: ${chalk.yellow(stats.pending)}`);
    console.log(`  Completed: ${chalk.green(stats.completed)}`);
    console.log(`  Overdue: ${chalk.red(stats.overdue)}`);
    
    console.log(chalk.bold('\nBy Priority:'));
    console.log(`  🔴 High: ${stats.byPriority.high}`);
    console.log(`  🟡 Medium: ${stats.byPriority.medium}`);
    console.log(`  🟢 Low: ${stats.byPriority.low}`);
    
    if (Object.keys(stats.byTag).length > 0) {
      console.log(chalk.bold('\nBy Tag:'));
      Object.entries(stats.byTag).forEach(([tag, count]) => {
        if (count > 0) {
          console.log(`  @${tag}: ${count}`);
        }
      });
    }

    console.log(chalk.gray('\nPress any key to continue...'));
    await this.waitForKeypress();
  }

  async showTags() {
    const tags = this.todoManager.getTags();
    console.clear();
    console.log(chalk.bold.blue('🏷️  All Tags\n'));
    
    if (tags.length === 0) {
      console.log(chalk.gray('No tags found. Add tags to todos with @tagname'));
    } else {
      tags.forEach(tag => {
        const count = this.todoManager.listTodos({ tag }).length;
        console.log(`  ${chalk.cyan(`@${tag}`)} (${count} todos)`);
      });
    }

    console.log(chalk.gray('\nPress any key to continue...'));
    await this.waitForKeypress();
  }

  async showHelp() {
    console.clear();
    console.log(chalk.bold.blue('💡 Help - Natural Language Todo CLI\n'));
    
    console.log(chalk.bold('Keyboard Shortcuts:'));
    console.log('  [n] - Add new todo');
    console.log('  [f] - Filter & search');
    console.log('  [e] - Edit mode (bulk operations)');
    console.log('  [o] - Options menu');
    console.log('  [q] - Quit');
    console.log('  [Enter] - Toggle todo completion');
    
    console.log(chalk.bold('\nNatural Language Format:'));
    console.log('  !       - High priority (red 🔴)');
    console.log('  _       - Low priority (green 🟢)');
    console.log('  (none)  - Medium priority (yellow 🟡)');
    console.log('  @tag    - Add tag to todo');
    console.log('  (date)  - Set due date');
    
    console.log(chalk.bold('\nDate Formats:'));
    console.log('  (today)       - Due today');
    console.log('  (tomorrow)    - Due tomorrow');
    console.log('  (2d)          - Due in 2 days');
    console.log('  (1w)          - Due in 1 week');
    console.log('  (3m)          - Due in 3 months');
    console.log('  (2025-07-01)  - Due on specific date');
    
    console.log(chalk.bold('\nExamples:'));
    console.log(chalk.gray('  "Buy groceries @shopping"'));
    console.log(chalk.gray('  "!Fix critical bug (2d) @work"'));
    console.log(chalk.gray('  "_Clean desk @home (1w)"'));
    console.log(chalk.gray('  "Meeting prep (2025-07-01) @work"'));

    console.log(chalk.gray('\nPress any key to continue...'));
    await this.waitForKeypress();
  }
}

const app = new TodoApp();
app.start().catch(console.error);