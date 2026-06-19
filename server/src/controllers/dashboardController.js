const Task = require('../models/Task');
const { asyncHandler } = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'High').length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingDeadlines = tasks
    .filter(
      (t) =>
        t.dueDate &&
        t.status !== 'Completed' &&
        new Date(t.dueDate) >= now
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const recentTasks = tasks.slice(0, 5);

  res.json({
    success: true,
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      completionRate,
      upcomingDeadlines,
      recentTasks,
    },
  });
});

module.exports = { getSummary };
