const Task = require('../models/Task');
const Application = require('../models/Application');
const { asyncHandler } = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
  const applications = await Application.find({ createdBy: req.user.id }).sort({
  createdAt: -1,
});
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'High').length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const statusCounts = [
    { name: 'Todo', value: pendingTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Completed', value: completedTasks },
  ];

  const priorityCounts = [
    { name: 'Low', value: tasks.filter((t) => t.priority === 'Low').length },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'Medium').length },
    { name: 'High', value: tasks.filter((t) => t.priority === 'High').length },
  ];

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
  const totalApplications = applications.length;
  const interviews = applications.filter((a) =>
  a.status.toLowerCase().includes('interview')
  ).length;
  const offers = applications.filter((a) => a.status === 'Offer Received').length;
  const rejections = applications.filter((a) => a.status === 'Rejected').length;
  const recentApplications = applications.slice(0, 5);
  res.json({
    success: true,
    summary: {
      userName: req.user.name,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      completionRate,
      statusCounts,
      priorityCounts,
      upcomingDeadlines,
      recentTasks,
      totalApplications,
      interviews,
      offers,
      rejections,
      recentApplications,
    },
  });
});

module.exports = { getSummary };
