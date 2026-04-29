/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */
// 1
module.exports.routes = {
  "/": { view: "pages/homepage" },

  "POST /api/auth/register": "AuthController.register",
  "POST /api/auth/login": "AuthController.login",
  
  "GET /api/auth/me": "AuthController.getMe",
  "PUT /api/auth/profile": "AuthController.updateProfile",
  "POST /api/auth/change-password": "AuthController.changePassword",
  'DELETE /api/auth/delete': 'AuthController.deleteAccount',

  "PUT /api/task/:id/archive": "TaskController.archive",
  "PUT /api/task/:id/restore": "TaskController.restore",

  'DELETE /api/task/:id/soft': 'TaskController.softDelete',    
  'DELETE /api/task/:id/hard': 'TaskController.hardDelete',    
  // 'PUT /api/task/:id/restore': 'TaskController.restoreFromTrash', 
  'GET /api/task/trash': 'TaskController.getTrash',            

  // Task
  "POST /api/task": {
    controller: "TaskController",
    action: "create",
    policies: ["isAuthenticated"],
  },

  "GET /api/task": {
    controller: "TaskController",
    action: "find",
    policies: ["isAuthenticated"],
  },

  "PUT /api/task/:id": {
    controller: "TaskController",
    action: "update",
    policies: ["isAuthenticated"],
  },

  "DELETE /api/task/:id": {
    controller: "TaskController",
    action: "delete",
    policies: ["isAuthenticated"],
  },
};
