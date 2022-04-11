const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const trainingSchema = require("../schema/TrainingSchema");
const userSchema = require("../schema/UserSchema");
const { companies } = require("../config");

const generateHash = () => {
  var today = new Date();
  var date = `${
    today.getUTCMonth() + 1
  }-${today.getUTCDate()}-${today.getFullYear()}`;
  var time = `${today.getUTCHours()}-${today.getUTCMinutes()}-${today.getUTCSeconds()}`;

  var key = `${date} ${time}`;
  var hash = 0;

  for (i = 0; i < key.length; i++) {
    char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  //   return hash;
  return Math.abs(hash);
};

router.get("/profile", (req, res, next) => {
  res.json({
    message: "You made it to the secure route",
    user: req.user,
    token: req.query.secret_token,
  });
});

router.post("/trainingTask/create", async (req, res, next) => {
  const companyDB = companies.get(req.body.assignerEmail.split("@")[1]);
  const User = mongoose.connection.useDb(companyDB).model("users", userSchema);
  const TrainingTask = mongoose.connection
    .useDb(companyDB)
    .model("assignTraining", trainingSchema);

  await User.findOne({ email: req.body.assignerEmail })
    .then(async (admin) => {
      if (!admin) {
        return res.json({
          code: 404,
          status: "error",
          message: "Assigner email doesn't exist",
        });
      }
      if (admin.positionTitle !== "CEO") {
        return res.json({
          code: 401,
          status: "error",
          message: "Assigner does not have Admin permissions",
        });
      }
      await User.find({})
        .then((users) => {
          employees = users.filter((user) => user.positionTitle !== "CEO");

          employees.forEach(async (employee) => {
            var taskData = {
              taskId: generateHash(),
              assignerId: admin.employeeId,
              assigneeId: employee.employeeId,
              taskName: req.body.taskName,
              taskLink: req.body.taskLink,
              taskDescription: req.body.taskDescription,
              startDate: req.body.startDate,
              dueDate: req.body.dueDate,
              status: "Incomplete",
            };
            const trainingTask = await TrainingTask.create(taskData);
            await trainingTask.save();
          });
          return res.json({
            code: 200,
            status: "success",
            message: "Successfully added training tasks",
          });
        })
        .catch((error) => {
          return res.json({
            code: 500,
            status: "error",
            message: "Internal server error",
          });
        });
    })
    .catch((error) => {
      return res.json({
        code: 500,
        status: "error",
        message: "Internal server error",
      });
    });
});

router.get("/trainingTask/get", async (req, res, next) => {
  const companyDB = companies.get(req.body.requestorEmail.split("@")[1]);

  const User = mongoose.connection.useDb(companyDB).model("users", userSchema);
  const TrainingTask = mongoose.connection
    .useDb(companyDB)
    .model("assignTraining", trainingSchema);

  await User.findOne({ employeeEmail: req.body.requestorEmail })
    .then(async (user) => {
      userTrainingTasks = {};
      await TrainingTask.find({ assigneeId: user.employeeId })
        .then((tasks) => {
          if (!tasks) {
            return res.json({
              code: 404,
              message: "No assigned tasks found for the user",
            });
          }
          userTrainingTasks["received"] = tasks;
        })
        .catch((err) => {
          return res.json({
            code: 500,
            message: err.message,
          });
        });
      await TrainingTask.find({ assignerId: user.employeeId })
        .then((tasks) => {
          if (!tasks) {
            return res.json({
              code: 404,
              message: "User has not created any training tasks",
            });
          }
          userTrainingTasks["created"] = tasks;
        })
        .catch((err) => {
          return res.json({
            code: 500,
            message: err.message,
          });
        });
      return res.json(userTrainingTasks);
    })
    .catch((err) => {});
});

router.patch("/trainingTask/edit", async (req, res, next) => {
  const companyDB = companies.get(req.body.requestorEmail.split("@")[1]);
  const TrainingTask = mongoose.connection
    .useDb(companyDB)
    .model("assignTraining", trainingSchema);

  await TrainingTask.findOne({ taskId: req.body.taskId })
    .then((task) => {
      if (!task) {
        return res.json({
          code: 404,
          message: "No task with such credentials found",
        });
      }
      if (req.body.requestorId === task.assignerId) {
        TrainingTask.updateMany(
          {
            taskId: req.body.taskId,
            assignerId: req.body.requestorId,
          },
          {
            ...req.body,
          }
        )
          .then(() => {
            return res.json({
              code: 200,
              message: "Training Tasks updated successfully",
            });
          })
          .catch((err) => {
            return res.json({ message: error.message });
          });
      } else {
        TrainingTask.updateOne(
          {
            taskId: req.body.taskId,
            assigneeId: req.body.requestorId,
          },
          {
            ...req.body,
          }
        )
          .then(() => {
            return res.json({
              code: 200,
              message: "Training Task updated successfully",
            });
          })
          .catch((error) => {
            return res.json({ message: error.message });
          });
      }
    })
    .catch((error) => {
      return res.json({ message: error.message });
    });
});

router.delete("/trainingTask/delete", async (req, res, next) => {
  const companyDB = companies.get(req.body.assignerEmail.split("@")[1]);
  const TrainingTask = mongoose.connection
    .useDb(companyDB)
    .model("assignTraining", trainingSchema);

  await TrainingTask.findOne({
    taskId: req.body.taskId,
    assignerId: req.body.assignerId,
  })
    .then(async (task) => {
      if (!task) {
        return res.json({
          code: 404,
          message: "No task with such credentials found",
        });
      }
      await TrainingTask.deleteMany({
        taskId: req.body.taskId,
        assignerId: req.body.assignerId,
      })
        .then(() => {
          return res.json({
            code: 200,
            message: "Tasks deleted successfully",
          });
        })
        .catch((err) => {
          return res.json(err);
        });
    })
    .catch((err) => {
      return res.json(err);
    });

  // try {
  //   const companyDB = companies.get(req.body.assignerEmail.split("@")[1]);
  //   const TrainingTask = mongoose.connection
  //     .useDb(companyDB)
  //     .model("assignTraining", trainingSchema);

  //   TrainingTask.findOne(
  //     {
  //       taskId: req.body.taskId,
  //       assignerEmail: req.body.assignerEmail,
  //     },
  //     (err, task) => {
  //       if (!task) {
  //         return res.json({
  //           code: 404,
  //           message: "No task with such credentials found",
  //         });
  //       }
  //       TrainingTask.deleteMany({
  //         taskId: req.body.taskId,
  //         assignerEmail: req.body.assignerEmail,
  //       })
  //         .then(() => {
  //           return res.json({
  //             code: 200,
  //             message: "Tasks deleted successfully",
  //           });
  //         })
  //         .catch((err) => {
  //           return res.json(err);
  //         });
  //     }
  //   );
  // } catch (error) {
  //   return res.json(error);
  // }
});

// router.post("/pto/create", (req, res, next) => {
//   try {
//     const companyDB = companies.get(req.body.requestorEmail.split("@")[1]);
//     const User = mongoose.connection
//       .useDb(companyDB)
//       .model("users", userSchema);
//     const PTOTask = mongoose.connection
//       .useDb(companyDB)
//       .model("PTORequests", ptoSchema);

//     User.findOne({ email: req.body.requestorEmail }, async (err, employee) => {
//       if (!employee) {
//         return res.json({ code: 404, message: "Employee not found" });
//       }
//       if (employee.positionTitle == "CEO") {
//         return res.json({
//           code: 401,
//           message: "The CEO does not need to request for Paid Time Off",
//         });
//       }
//       User.findOne({ email: req.body.managerEmail }, async (err, manager) => {
//         if (!manager) {
//           return res.json({ code: 404, message: "Manager not found" });
//         }
//         if (employee.managerId != manager.employeeId) {
//           return res.json({
//             code: 401,
//             message: "Invalid Manager credentials",
//           });
//         }
//         var taskData = {
//           taskId: Math.abs(
//             generateHash(employee.email + req.body.startDate + req.body.endDate)
//           ),
//           requestorEmail: req.body.requestorEmail,
//           managerEmail: req.body.managerEmail,
//           managerId: manager.managerId,
//           title: req.body.title,
//           startDate: req.body.startDate,
//           endDate: req.body.endDate,
//           reason: req.body.reason,
//           status: "Pending",
//         };

//         const ptoRequest = await PTOTask.create(taskData);
//         await ptoRequest.save();
//         return res.json({
//           code: 200,
//           message: "Successfully added Paid Time Off Request",
//         });
//       });
//     });
//   } catch (error) {
//     return res.json(error);
//   }
// });

// router.patch("pto/edit", (req, res, next) => {
//   try {
//     const companyDB = companies.get(req.body.requestorEmail.split("@")[1]);
//     const PTOTask = mongoose.connection
//       .useDb(companyDB)
//       .model("PTORequests", ptoSchema);
//     PTOTask.findOne(
//       {
//         taskId: req.body.taskId,
//         requestorEmail: req.body.requestorEmail,
//       },
//       (err, task) => {
//         if (!task) {
//           return res.json({
//             code: 404,
//             message: "No task with such credentials found",
//           });
//         }
//         PTOTask.updateOne(
//           {
//             taskId: req.body.taskId,
//             requestorEmail: req.body.requestorEmail,
//           },
//           {
//             ...req.body,
//           }
//         ).then(() => {
//           return res.json({
//             code: 200,
//             message: "Paid Time Off Request updated successfully",
//           });
//         });
//       }
//     );
//   } catch (error) {
//     return res.json(error);
//   }
// });
// router.delete("pto/delete", (req, res, next) => {
//   try {
//     const companyDB = companies.get(req.body.requestorEmail.split("@")[1]);
//     const PTOTask = mongoose.connection
//       .useDb(companyDB)
//       .model("PTORequests", ptoSchema);

//     PTOTask.findOne({ taskId: req.body.taskId }, (err, task) => {
//       if (!task) {
//         return res.json({ code: 404, message: "Request not found" });
//       }
//       if (task.requestorEmail !== req.body.requestorEmail) {
//         return res.json({
//           code: 401,
//           message: "User does not have deleting permissions",
//         });
//       }
//       PTOTask.delete({
//         taskId: req.body.taskId,
//         requestorEmail: req.body.requestorEmail,
//       })
//         .then(() => {
//           return res.json({
//             code: 200,
//             message: "Paid Time Off Request deleted successfully",
//           });
//         })
//         .catch((err) => {
//           return res.json(err);
//         });
//     });
//   } catch (error) {
//     return res.json(error);
//   }
// });

module.exports = router;
