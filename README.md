# Todo CLI

A beautiful, interactive command-line todo application built with Node.js. Manage your tasks with an intuitive terminal interface featuring arrow key navigation, instant toggling, and bulk operations.

## ✨ Features

- **Interactive Interface** - Navigate with arrow keys, no complex commands to remember
- **Instant Todo Toggle** - Click any todo to mark complete/incomplete
- **Persistent Storage** - Todos saved automatically in your home directory
- **Bulk Operations** - Edit mode for managing multiple todos at once
- **Beautiful Design** - Colorful, emoji-rich interface with clear visual indicators
- **Streamlined Workflow** - No interruptions, smooth navigation between actions

## 🚀 Installation

### Global Installation (Recommended)

```bash
npm install -g @nosekbk/todo-cli
```

Then use anywhere:
```bash
todo
```

### Local Installation

```bash
npm install @nosekbk/todo-cli
npx todo-cli
```

### From Source

```bash
git clone https://github.com/bartekkustra/todo-cli.git
cd todo-cli
npm install
npm install -g .
```

## 🎮 Usage

Simply run `todo` to start the interactive interface:

```bash
todo
```

### Main Interface

The default view shows your todo list with these options:

- **Select any todo** → Toggle completion status (✅/⭕)
- **📝 Add new todo** → Create a new task
- **✏️ Edit mode** → Bulk operations on multiple todos
- **🗑️ Clear completed** → Remove all completed todos
- **🚪 Quit** → Exit the application

### Navigation

- **Arrow Keys** ↑↓ - Navigate through todos and options
- **Enter** - Select todo (to toggle) or action
- **Space** - In edit mode, select/deselect multiple items
- **Ctrl+C** - Quick exit

### Edit Mode (Bulk Operations)

1. Select **✏️ Edit mode** from main menu
2. Use **Space** to select multiple todos
3. Choose action:
   - **✅ Mark all as completed**
   - **⭕ Mark all as pending** 
   - **🗑️ Delete all selected**

## 📁 Data Storage

Todos are automatically saved to `~/.todos.json` in your home directory. The file is created automatically and persists between sessions.

## 🛠️ Development

### Prerequisites

- Node.js 16+ (see `.nvmrc` for exact version)
- npm

### Setup

```bash
git clone https://github.com/bartekkustra/todo-cli.git
cd todo-cli
nvm use  # If using nvm
npm install
```

### Running Locally

```bash
npm start
# or
node bin/todo.js
```

### Project Structure

```
todo-cli/
├── bin/
│   └── todo.js          # Main CLI application
├── lib/
│   └── todoManager.js   # Todo data management
├── package.json         # Package configuration
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── .nvmrc              # Node version specification
```

## 📦 Dependencies

- **inquirer** - Interactive command line prompts
- **chalk** - Terminal colors and styling

## 🔧 Configuration

No configuration needed! The app works out of the box with sensible defaults.

## 🐛 Troubleshooting

### Permission Issues
If you get permission errors during global installation:
```bash
sudo npm install -g @nosekbk/todo-cli
```

### Node Version Issues
Make sure you're using Node.js 16+:
```bash
node --version
```

### Data File Issues
If todos aren't persisting, check that `~/.todos.json` is writable:
```bash
ls -la ~/.todos.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for beautiful CLI prompts
- Styled with [Chalk](https://github.com/chalk/chalk) for terminal colors
- Inspired by the need for a simple, visual todo manager

---

**Happy task managing!** 🗒️✨