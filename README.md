# TaskTree 🌳

> **Try it now**: [tasktree.vercel.app](https://tasktree.vercel.app)

![TaskTree Preview](demo/mockup.png)

TaskTree is a powerful task management application that helps you organize tasks in hierarchical structures. With its innovative dual-view system and rich feature set, TaskTree provides an intuitive way to manage complex task relationships and workflows.

## ✨ Key Features

### 📊 Dual View System
- **List View**: Traditional, drag-and-drop enabled list interface
- **Graph View**: Interactive visualization of task relationships
- **Real-time Sync**: Both views stay synchronized as you make changes

### 📑 Task Organization
- **Hierarchical Structure**: Create parent-child relationships between tasks
- **Multi-Parent Support**: Tasks can have multiple parent tasks
- **Drag & Drop**: Easily reorganize tasks and their relationships
- **Visual Connections**: Animated links between related tasks in graph view

### 🎯 Task Management
- **Priority Levels**: Color-coded priorities (Low, Medium, High)
- **Due Dates**: Set and track deadlines for tasks
- **Tags**: Categorize tasks with custom tags
- **Notes**: Add detailed descriptions and notes to tasks
- **Completion Tracking**: Mark tasks as complete and track progress

### 🔍 Advanced Filtering & Search
- **Search**: Find tasks by title or description
- **Priority Filter**: Filter tasks by priority level
- **Completion Filter**: Show/hide completed tasks
- **Smart Sorting**: Sort by creation date, priority, due date, or completion status

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly across different screen sizes
- **Real-time Updates**: Changes reflect immediately across views
- **Intuitive Controls**: Easy-to-use interface for managing tasks

## 🚀 Technical Stack

- **Frontend**:
  - React with TypeScript
  - Zustand for state management
  - ReactFlow for graph visualization
  - DnD-kit for drag-and-drop functionality
  - TailwindCSS for styling

- **Backend**:
  - Supabase for data storage and real-time updates
  - User authentication and data persistence

## 💻 Installation

1. Clone the repository
```bash
git clone https://github.com/erfangolpour/TaskTree
cd TaskTree
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your Supabase credentials to .env
```

4. Start the development server
```bash
npm run dev
```

## 📖 Usage Guide

### Creating Tasks
1. Click the "Add Task" button
2. Fill in task details:
   - Title (required)
   - Description
   - Priority level
   - Due date
   - Tags
3. Submit to create the task

### Managing Relationships
- **List View**: Drag and drop tasks to create parent-child relationships
- **Graph View**: 
  - Click the '+' button on a task to add a child task
  - Drag connections between tasks to create relationships
  - Use the mouse wheel to zoom in/out
  - Drag the canvas to pan around

### Task Organization Tips
- Use priorities to highlight urgent tasks
- Group related tasks using parent-child relationships
- Add tags for easy filtering and categorization
- Utilize the search function to quickly find specific tasks

### View Management
- Toggle between List and Graph views using the view selector
- Use filters and sorting options to organize your view
- Switch between dark and light modes using the theme toggle

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for better task management
