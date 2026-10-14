const STORAGE_KEY = "studypilot-tasks-v1";

const sampleTasks = [
  {
    id: "sample-1",
    title: "Review Discrete Mathematics notes",
    subject: "Mathematics",
    due: getDateOffset(0),
    priority: "high",
    completed: false
  },
  {
    id: "sample-2",
    title: "Practice 2 JavaScript problems",
    subject: "Programming",
    due: getDateOffset(1),
    priority: "medium",
    completed: false
  },
  {
    id: "sample-3",
    title: "Read UI/UX design lesson",
    subject: "Design",
    due: getDateOffset(-1),
    priority: "low",
    completed: true
  }
];

let tasks = loadTasks();
let currentView = "all";

const taskForm = document.querySelector("#task-form");
const taskTitleInput = document.querySelector("#task-title");
const taskSubjectInput = document.querySelector("#task-subject");
const taskDueInput = document.querySelector("#task-due");
const taskPriorityInput = document.querySelector("#task-priority");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");

function getDateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...sampleTasks];
  } catch (error) {
    console.warn("Could not load saved tasks:", error);
    return [...sampleTasks];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    alert("Your browser could not save tasks. Try using a normal browser window with storage enabled.");
  }
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getVisibleTasks() {
  if (currentView === "today") {
    const today = getDateOffset(0);
    return tasks.filter(task => task.due === today && !task.completed);
  }
  if (currentView === "completed") return tasks.filter(task => task.completed);
  return tasks;
}

function updateStats() {
  const completed = tasks.filter(task => task.completed).length;
  const today = getDateOffset(0);
  const dueToday = tasks.filter(task => task.due === today && !task.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  document.querySelector("#total-count").textContent = tasks.length;
  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#due-count").textContent = dueToday;
  document.querySelector("#progress-number").textContent = `${progress}%`;
  document.querySelector("#progress-bar").style.width = `${progress}%`;
  document.querySelector("#progress-caption").textContent =
    tasks.length === 0 ? "Start with your first task" :
    progress === 100 ? "Amazing — everything is complete!" :
    "Keep going, you're making progress";
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();
  document.querySelector("#list-count").textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-main";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;
    main.append(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    if (task.subject) {
      const subject = document.createElement("span");
      subject.className = "subject-tag";
      subject.textContent = task.subject;
      meta.append(subject);
    }

    const priority = document.createElement("span");
    priority.className = `priority-tag ${task.priority}`;
    priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`;
    meta.append(priority);

    const due = document.createElement("span");
    due.className = "due-tag";
    due.textContent = formatDate(task.due);
    if (task.due && task.due < getDateOffset(0) && !task.completed) due.classList.add("overdue");
    meta.append(due);
    main.append(meta);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(itemTask => itemTask.id !== task.id);
      saveTasks();
      render();
    });

    item.append(checkbox, main, deleteButton);
    taskList.append(item);
  });

  emptyState.hidden = visibleTasks.length > 0;
  updateStats();
}

function render() {
  const titles = {
    all: "My tasks",
    today: "Due today",
    completed: "Completed tasks"
  };
  document.querySelector("#list-title").textContent = titles[currentView];
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.view === currentView);
  });
  renderTasks();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  tasks.unshift({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    subject: taskSubjectInput.value.trim(),
    due: taskDueInput.value,
    priority: taskPriorityInput.value,
    completed: false
  });

  saveTasks();
  taskForm.reset();
  taskPriorityInput.value = "medium";
  currentView = "all";
  render();
  taskTitleInput.focus();
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    render();
  });
});

document.querySelector("#clear-completed").addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  const confirmed = window.confirm("Reset the list to the sample tasks? Your current tasks will be replaced.");
  if (!confirmed) return;
  tasks = [...sampleTasks];
  currentView = "all";
  saveTasks();
  render();
});

const now = new Date();
document.querySelector("#date-pill").textContent = now.toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric"
});
document.querySelector("#today-label").textContent = now.toLocaleDateString(undefined, {
  weekday: "long", month: "long", day: "numeric"
}).toUpperCase();

render();
